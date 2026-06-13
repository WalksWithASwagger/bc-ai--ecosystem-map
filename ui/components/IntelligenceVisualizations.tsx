'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';

import type { IndustryGrowthData, GeographicCluster, FundingInsight } from '../lib/intelligence-engine';

interface IntelligenceVisualizationsProps {
  growthData: IndustryGrowthData[];
  clusterData: GeographicCluster[];
  fundingData: FundingInsight[];
}

const NEON_COLORS = [
  '#00f5ff', // neon-blue
  '#39ff14', // neon-green
  '#ff073a', // neon-pink
  '#ffff00', // neon-yellow
  '#bf00ff', // neon-purple
  '#ff6600', // neon-orange
  '#00ffff', // cyan
  '#ff1493'  // deep pink
];

export default function IntelligenceVisualizations({ 
  growthData = [], 
  clusterData = [], 
  fundingData = [] 
}: IntelligenceVisualizationsProps) {
  
  // Early return with loading state if no data
  if (growthData.length === 0 && clusterData.length === 0 && fundingData.length === 0) {
    return (
      <div className="w-full h-96 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-cyber-border">
        <div className="text-terminal-gray font-mono text-sm animate-pulse">processing.intelligence.data...</div>
      </div>
    );
  }

  // Growth Hotness Chart Data
  const hotnessChartData = useMemo(() => {
    return growthData.slice(0, 8).map((sector, index) => ({
      name: sector.category.length > 15 ? sector.category.substring(0, 15) + '...' : sector.category,
      fullName: sector.category,
      hotness: sector.hotness,
      organizations: sector.organizations.length,
      growthRate: sector.growthRate,
      funding: sector.totalFunding / 1000000, // Convert to millions
      fill: NEON_COLORS[index % NEON_COLORS.length]
    }));
  }, [growthData]);

  // Cluster Strength Visualization
  const clusterChartData = useMemo(() => {
    return clusterData.slice(0, 10).map((cluster, index) => ({
      name: cluster.city,
      strength: cluster.clusterStrength,
      density: cluster.density,
      region: cluster.region,
      fill: NEON_COLORS[index % NEON_COLORS.length]
    }));
  }, [clusterData]);

  // Funding Distribution
  const fundingDistribution = useMemo(() => {
    const stages = ['Seed/Pre-Seed', 'Series A/B', 'Series B/C', 'Mature/Growth'];
    return stages.map((stage, index) => {
      const stageData = fundingData.filter(f => f.fundingStage === stage);
      const totalFunding = stageData.reduce((sum, f) => sum + f.estimatedFunding, 0);
      
      return {
        name: stage,
        count: stageData.length,
        totalFunding: totalFunding / 1000000, // Convert to millions
        avgFunding: stageData.length > 0 ? totalFunding / stageData.length / 1000000 : 0,
        fill: NEON_COLORS[index % NEON_COLORS.length]
      };
    });
  }, [fundingData]);

  // Growth vs Funding Scatter
  const growthFundingScatter = useMemo(() => {
    return growthData.map((sector, index) => ({
      x: sector.growthRate,
      y: sector.totalFunding / 1000000,
      z: sector.organizations.length,
      name: sector.category,
      fill: NEON_COLORS[index % NEON_COLORS.length]
    }));
  }, [growthData]);

  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-cyber-border rounded-lg p-3 backdrop-blur-md">
          <p className="text-neon-blue font-mono text-sm font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-terminal-gray text-sm">
              <span style={{ color: entry.color }}>{entry.dataKey}: </span>
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Sector Hotness Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 border border-cyber-border rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-neon-blue font-mono mb-6">
          SECTOR HOTNESS INDEX
        </h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={hotnessChartData}>
              <RadialBar
                dataKey="hotness"
                cornerRadius={4}
                fill="#00f5ff"
                className="drop-shadow-neon-blue"
              />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {hotnessChartData.slice(0, 4).map((sector, index) => (
            <div key={sector.name} className="text-center">
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ backgroundColor: sector.fill }}
              />
              <div className="text-xs text-terminal-gray font-mono">
                {sector.name}
              </div>
              <div className="text-sm font-bold text-white">
                {sector.hotness}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Rate vs Organizations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/50 border border-cyber-border rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-neon-green font-mono mb-6">
            GROWTH ACCELERATION
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hotnessChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#666', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="growthRate"
                  stroke="#39ff14"
                  fill="#39ff14"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  className="drop-shadow-neon-green"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cluster Strength */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/50 border border-cyber-border rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-neon-purple font-mono mb-6">
            GEOGRAPHIC CLUSTERS
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clusterChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis type="number" tick={{ fill: '#666', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#666', fontSize: 10 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="strength"
                  fill="#bf00ff"
                  radius={[0, 4, 4, 0]}
                  className="drop-shadow-neon-purple"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Funding Stage Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/50 border border-cyber-border rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-neon-yellow font-mono mb-6">
            FUNDING LANDSCAPE
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fundingDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  className="drop-shadow-lg"
                >
                  {fundingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {fundingDistribution.map((stage, index) => (
              <div key={stage.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.fill }}
                />
                <div className="text-xs text-terminal-gray font-mono">
                  {stage.name}: {stage.count}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Growth vs Funding Correlation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/50 border border-cyber-border rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-neon-pink font-mono mb-6">
            GROWTH × FUNDING MATRIX
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Growth Rate (%)"
                  tick={{ fill: '#666', fontSize: 12 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Funding ($M)"
                  tick={{ fill: '#666', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-black/90 border border-cyber-border rounded-lg p-3 backdrop-blur-md">
                          <p className="text-neon-pink font-mono text-sm font-bold">{data.name}</p>
                          <p className="text-terminal-gray text-xs">Growth: {data.x.toFixed(1)}%</p>
                          <p className="text-terminal-gray text-xs">Funding: ${data.y.toFixed(1)}M</p>
                          <p className="text-terminal-gray text-xs">Orgs: {data.z}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={growthFundingScatter}
                  fill="#ff073a"
                  className="drop-shadow-neon-pink"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Funding Timeline Simulation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-black/50 border border-cyber-border rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-neon-blue font-mono mb-6">
          ECOSYSTEM MOMENTUM TRENDS
        </h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hotnessChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis 
                dataKey="name"
                tick={{ fill: '#666', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="hotness"
                stroke="#00f5ff"
                strokeWidth={3}
                dot={{ fill: '#00f5ff', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, className: 'drop-shadow-neon-blue' }}
                className="drop-shadow-neon-blue"
              />
              <Line
                type="monotone"
                dataKey="organizations"
                stroke="#39ff14"
                strokeWidth={2}
                dot={{ fill: '#39ff14', strokeWidth: 2, r: 4 }}
                className="drop-shadow-neon-green"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-neon-blue rounded-full" />
            <span className="text-terminal-gray font-mono text-sm">Hotness Index</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-neon-green rounded-full" />
            <span className="text-terminal-gray font-mono text-sm">Organization Count</span>
          </div>
        </div>
      </motion.div>

      {/* Proprietary Intelligence Insights */}
      <motion.div 
        className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-neon-blue/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse" />
          <h3 className="text-neon-pink font-mono text-lg font-bold">proprietary.intelligence.matrix</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ecosystem Scale Intelligence */}
          <div className="bg-black/30 p-4 rounded border border-neon-blue/20">
            <div className="text-neon-blue font-mono text-sm mb-2">ecosystem.scale</div>
            <div className="text-3xl font-bold text-neon-green mb-2">630</div>
            <div className="text-terminal-gray font-mono text-xs">total.organizations</div>
            <div className="mt-3 text-neon-yellow font-mono text-sm">
              39% startups.scale-ups
            </div>
          </div>

          {/* Digital Maturity Intelligence */}
          <div className="bg-black/30 p-4 rounded border border-neon-green/20">
            <div className="text-neon-green font-mono text-sm mb-2">digital.presence</div>
            <div className="flex items-center gap-4 mb-2">
              <div className="text-2xl font-bold text-neon-blue">57%</div>
              <div className="text-2xl font-bold text-neon-pink">56%</div>
            </div>
            <div className="text-terminal-gray font-mono text-xs">websites | linkedin</div>
            <div className="mt-3 text-neon-orange font-mono text-sm">
              professional.maturity.high
            </div>
          </div>

          {/* Innovation Pipeline Intelligence */}
          <div className="bg-black/30 p-4 rounded border border-neon-yellow/20">
            <div className="text-neon-yellow font-mono text-sm mb-2">innovation.pipeline</div>
            <div className="text-3xl font-bold text-neon-purple mb-2">7%</div>
            <div className="text-terminal-gray font-mono text-xs">academic.research</div>
            <div className="mt-3 text-neon-green font-mono text-sm">
              foundation.strong
            </div>
          </div>
        </div>

        {/* Proprietary Insights Summary */}
        <div className="mt-6 bg-black/40 p-4 rounded border border-neon-pink/20">
          <div className="text-neon-pink font-mono text-sm mb-3">intelligence.summary</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="flex items-start gap-2">
              <span className="text-neon-blue">▶</span>
              <span className="text-terminal-gray">critical.mass.achieved → 630+ organizations</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-neon-green">▶</span>
              <span className="text-terminal-gray">startup.dominance → 39% entrepreneurial</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-neon-yellow">▶</span>
              <span className="text-terminal-gray">digital.adoption → 57% professional.web</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-neon-purple">▶</span>
              <span className="text-terminal-gray">research.foundation → 7% academic.base</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}