import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API Route: Research Projects
 * 
 * Manages multiple research databases/projects
 * GET /api/research/projects - List all projects
 * POST /api/research/projects - Create new project
 */

interface Project {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  dataSources: {
    notion: {
      databaseId: string;
      tokenEnvVar: string;
    };
  };
  pipelines: {
    [key: string]: {
      enabled: boolean;
      frequency: string;
    };
  };
}

const CONFIGS_DIR = path.join(process.cwd(), '../tools/10-multi-db/configs');

export async function GET(request: NextRequest) {
  try {
    // Ensure configs directory exists
    if (!fs.existsSync(CONFIGS_DIR)) {
      fs.mkdirSync(CONFIGS_DIR, { recursive: true });
      
      // Create default BC AI project if none exist
      const defaultProject = createDefaultProject();
      saveProject(defaultProject);
    }

    // Read all project configs
    const configFiles = fs.readdirSync(CONFIGS_DIR).filter(f => f.endsWith('.json'));
    const projects = configFiles.map(file => {
      const configPath = path.join(CONFIGS_DIR, file);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      return {
        id: config.id,
        name: config.name,
        type: config.type,
        description: config.description,
        status: config.status,
        createdAt: config.createdAt,
        pipelinesEnabled: Object.keys(config.pipelines).filter(p => config.pipelines[p].enabled),
        recordCount: getProjectRecordCount(config.id)
      };
    });

    return NextResponse.json({
      success: true,
      projects: projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, type, description, notionDatabaseId } = body;

    if (!id || !name || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, name, type' },
        { status: 400 }
      );
    }

    // Check if project already exists
    const configPath = path.join(CONFIGS_DIR, `${id}.json`);
    if (fs.existsSync(configPath)) {
      return NextResponse.json(
        { success: false, error: 'Project already exists' },
        { status: 400 }
      );
    }

    // Create new project config
    const project: Project = {
      id,
      name,
      type,
      description: description || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      
      dataSources: {
        notion: {
          databaseId: notionDatabaseId || '',
          tokenEnvVar: `NOTION_TOKEN_${id.toUpperCase()}`
        }
      },

      pipelines: {
        discovery: { enabled: true, frequency: 'daily' },
        enrichment: { enabled: true, frequency: 'weekly' },
        funding: { enabled: type === 'funding', frequency: 'daily' },
        competitive: { enabled: true, frequency: 'weekly' },
        temporal: { enabled: true, frequency: 'continuous' }
      }
    };

    // Save project config
    saveProject(project);

    // Create project directories using the ProjectManager
    const { spawn } = require('child_process');
    const createProcess = spawn('node', [
      path.join(process.cwd(), '../tools/10-multi-db/project-manager.js'),
      'create',
      id,
      name,
      type,
      description,
      notionDatabaseId || ''
    ]);

    createProcess.on('close', (code: number | null) => {
      if (code !== 0) {
        console.error(`Project creation process exited with code ${code}`);
      }
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        type: project.type,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

function createDefaultProject(): Project {
  return {
    id: 'bc-ai-ecosystem',
    name: 'BC AI Ecosystem',
    type: 'ecosystem',
    description: 'British Columbia AI and tech ecosystem mapping',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    
    dataSources: {
      notion: {
        databaseId: process.env.NOTION_DATABASE_ID || '',
        tokenEnvVar: 'NOTION_TOKEN'
      }
    },

    pipelines: {
      discovery: { enabled: true, frequency: 'daily' },
      enrichment: { enabled: true, frequency: 'weekly' },
      funding: { enabled: true, frequency: 'daily' },
      competitive: { enabled: true, frequency: 'weekly' },
      temporal: { enabled: true, frequency: 'continuous' }
    }
  };
}

function saveProject(project: Project) {
  const configPath = path.join(CONFIGS_DIR, `${project.id}.json`);
  fs.writeFileSync(configPath, JSON.stringify(project, null, 2));
}

function getProjectRecordCount(projectId: string): number {
  try {
    const dataPath = path.join(process.cwd(), `../data/projects/${projectId}/data/entities.json`);
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return data.entities?.length || 0;
    }
  } catch (error) {
    // Silent fail
  }
  return 0;
}