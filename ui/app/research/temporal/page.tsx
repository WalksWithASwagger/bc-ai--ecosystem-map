'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain,
  Search,
  Clock,
  TrendingUp,
  Network,
  Zap,
  ArrowRight,
  Lightbulb,
  Database,
  Activity,
  BarChart3,
  ChevronDown,
  History,
  GitBranch
} from 'lucide-react';

interface TemporalQuery {
  id: string;
  question: string;
  answer: string;
  evidence: string[];
  insights: string[];
  confidence: number;
  temporal_patterns?: string;
  related_questions: string[];
  timestamp: string;
  execution_time_ms: number;
}

interface KnowledgeGraphStats {
  totalTriplets: number;
  totalEntities: number;
  totalRelationships: number;
  timeSpan: {
    earliest: string;
    latest: string;
  };
  entityTypes: Record<string, number>;
  relationshipTypes: Record<string, number>;
}

export default function TemporalKnowledgeGraphPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<TemporalQuery | null>(null);
  const [queryHistory, setQueryHistory] = useState<TemporalQuery[]>([]);
  const [stats, setStats] = useState<KnowledgeGraphStats | null>(null);
  const [selectedExample, setSelectedExample] = useState('');

  const exampleQueries = {
    funding: [
      "Which companies raised the most funding in 2024?",
      "Show me the total funding raised by FinTech companies",
      "Which investors are most active in BC AI funding?",
      "What is the funding timeline for Vancouver AI companies?"
    ],
    relationships: [
      "Which companies have Rhino Ventures invested in?",
      "What partnerships has AlayaCare formed over time?",
      "Show me the investor network for Series A companies",
      "Which executives have moved between BC AI companies?"
    ],
    temporal: [
      "How has the BC AI ecosystem grown over the past 5 years?",
      "Which companies pivoted their focus in 2023?",
      "Track the evolution of CleanTech AI companies",
      "Compare Q1 2024 vs Q1 2023 funding landscape"
    ],
    competitive: [
      "Which companies compete in the same space as AlayaCare?",
      "Show me emerging competitors to established companies",
      "What market segments are seeing the most new entrants?",
      "Which companies have similar investor profiles?"
    ]
  };

  useEffect(() => {
    fetchKnowledgeGraphStats();
    loadQueryHistory();
  }, []);

  const fetchKnowledgeGraphStats = async () => {
    try {
      const response = await fetch('/api/research/temporal/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch KG stats:', error);
    }
  };

  const loadQueryHistory = () => {
    const saved = localStorage.getItem('temporal_query_history');
    if (saved) {
      setQueryHistory(JSON.parse(saved));
    }
  };

  const saveQueryHistory = (newQuery: TemporalQuery) => {
    const updated = [newQuery, ...queryHistory.slice(0, 9)]; // Keep last 10
    setQueryHistory(updated);
    localStorage.setItem('temporal_query_history', JSON.stringify(updated));
  };

  const executeQuery = async (questionText: string) => {
    if (!questionText.trim()) return;

    setIsLoading(true);
    setQuery(questionText);
    
    try {
      const startTime = Date.now();
      const response = await fetch('/api/research/temporal/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText })
      });
      
      const data = await response.json();
      const executionTime = Date.now() - startTime;
      
      if (data.success) {
        const result: TemporalQuery = {
          id: `query_${Date.now()}`,
          question: questionText,
          answer: data.result.answer,
          evidence: data.result.evidence || [],
          insights: data.result.insights || [],
          confidence: data.result.confidence || 0.8,
          temporal_patterns: data.result.temporal_patterns,
          related_questions: data.result.related_questions || [],
          timestamp: new Date().toISOString(),
          execution_time_ms: executionTime
        };
        
        setCurrentResult(result);
        saveQueryHistory(result);
      } else {
        setCurrentResult({
          id: `error_${Date.now()}`,
          question: questionText,
          answer: `Error: ${data.error || 'Query execution failed'}`,
          evidence: [],
          insights: [],
          confidence: 0,
          related_questions: [],
          timestamp: new Date().toISOString(),
          execution_time_ms: executionTime
        });
      }
    } catch (error) {
      console.error('Query execution failed:', error);
      setCurrentResult({
        id: `error_${Date.now()}`,
        question: questionText,
        answer: 'Network error occurred while executing query.',
        evidence: [],
        insights: [],
        confidence: 0,
        related_questions: [],
        timestamp: new Date().toISOString(),
        execution_time_ms: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setSelectedExample('');
    executeQuery(example);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Temporal Knowledge Graph</h1>
              <p className="text-gray-600">Multi-hop reasoning over the BC AI ecosystem timeline</p>
            </div>
          </div>
          
          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-4 gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{stats.totalTriplets.toLocaleString()} facts</span>
              </div>
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{stats.totalEntities.toLocaleString()} entities</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{stats.totalRelationships.toLocaleString()} relationships</span>
              </div>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{stats.timeSpan.earliest} - {stats.timeSpan.latest}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Query Interface */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Query Input */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Ask the Knowledge Graph</h2>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask complex questions about the BC AI ecosystem over time..."
                    className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        executeQuery(query);
                      }
                    }}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    Cmd+Enter to execute
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Temporal reasoning enabled • Multi-hop traversal
                    </span>
                  </div>
                  <button
                    onClick={() => executeQuery(query)}
                    disabled={isLoading || !query.trim()}
                    className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      isLoading || !query.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Execute Query
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Query Result */}
            {currentResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Query Result</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{currentResult.execution_time_ms}ms</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      currentResult.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                      currentResult.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(currentResult.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Question */}
                  <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-gray-900">{currentResult.question}</p>
                  </div>
                  
                  {/* Answer */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-900">{currentResult.answer}</p>
                  </div>
                  
                  {/* Evidence */}
                  {currentResult.evidence.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Evidence
                      </h4>
                      <ul className="space-y-1">
                        {currentResult.evidence.map((evidence, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Insights */}
                  {currentResult.insights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Insights
                      </h4>
                      <ul className="space-y-1">
                        {currentResult.insights.map((insight, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Temporal Patterns */}
                  {currentResult.temporal_patterns && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Temporal Patterns
                      </h4>
                      <p className="text-sm text-gray-600 p-3 bg-green-50 rounded">
                        {currentResult.temporal_patterns}
                      </p>
                    </div>
                  )}
                  
                  {/* Related Questions */}
                  {currentResult.related_questions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Follow-up Questions</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentResult.related_questions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => executeQuery(question)}
                            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Example Queries */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Queries</h3>
              
              <div className="space-y-4">
                {Object.entries(exampleQueries).map(([category, queries]) => (
                  <div key={category}>
                    <button
                      onClick={() => setSelectedExample(selectedExample === category ? '' : category)}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      <span className="capitalize">{category}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        selectedExample === category ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {selectedExample === category && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-2"
                      >
                        {queries.map((query, index) => (
                          <button
                            key={index}
                            onClick={() => handleExampleClick(query)}
                            className="block w-full text-left text-xs text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors"
                          >
                            {query}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Query History */}
            {queryHistory.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Queries</h3>
                
                <div className="space-y-3">
                  {queryHistory.slice(0, 5).map((query, index) => (
                    <div key={query.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <button
                        onClick={() => executeQuery(query.question)}
                        className="block w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {query.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(query.timestamp).toLocaleDateString()}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            query.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                            query.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(query.confidence * 100)}%
                          </span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Graph Stats */}
            {stats && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Graph Statistics</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Entity Types</h4>
                    <div className="space-y-1">
                      {Object.entries(stats.entityTypes).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{type}</span>
                          <span className="text-gray-900">{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Top Relationships</h4>
                    <div className="space-y-1">
                      {Object.entries(stats.relationshipTypes)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([type, count]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="text-gray-600">{type.replace(/_/g, ' ')}</span>
                            <span className="text-gray-900">{count.toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}