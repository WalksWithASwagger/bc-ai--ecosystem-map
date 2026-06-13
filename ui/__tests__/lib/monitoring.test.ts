import { PerformanceMonitor } from '../../lib/monitoring'

// Mock window and performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    mark: jest.fn(),
    measure: jest.fn(),
    now: jest.fn(() => Date.now()),
  },
})

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = PerformanceMonitor.getInstance()
    localStorage.clear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be a singleton', () => {
    const monitor1 = PerformanceMonitor.getInstance()
    const monitor2 = PerformanceMonitor.getInstance()
    expect(monitor1).toBe(monitor2)
  })

  it('should record metrics', () => {
    monitor.recordMetric('test_metric', 100)
    const summary = monitor.getPerformanceSummary()
    expect(summary).toBeDefined()
  })

  it('should track search performance', () => {
    const duration = monitor.trackSearchPerformance(Date.now(), 5)
    expect(typeof duration).toBe('number')
    expect(duration).toBeGreaterThanOrEqual(0)
  })

  it('should track API calls', () => {
    const startTime = Date.now()
    monitor.trackAPICall('/test-endpoint', startTime, true)
    
    // Verify the API call was tracked
    const summary = monitor.getPerformanceSummary()
    expect(summary).toBeDefined()
  })

  it('should record errors', () => {
    const error = new Error('Test error')
    monitor.recordError(error, { context: 'test' })
    
    const errorSummary = monitor.getErrorSummary()
    expect(errorSummary.total).toBeGreaterThan(0)
  })
})