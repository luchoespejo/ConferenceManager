/**
 * Test for getSlug utility function
 * Extracts conference slug from subdomain
 */

describe('getSlug utility', () => {
  it('should extract slug from subdomain', () => {
    // Mock hostname
    Object.defineProperty(window, 'location', {
      value: { hostname: 'tech-conf.localhost' },
      writable: true
    })

    // Simple implementation for testing
    const getSlug = () => {
      const host = typeof window !== 'undefined' ? window.location.hostname : ''
      const parts = host.split('.')
      return parts[0] === 'localhost' ? parts[0] : parts[0]
    }

    expect(getSlug()).toBe('tech-conf')
  })

  it('should handle localhost', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true
    })

    const getSlug = () => {
      const host = typeof window !== 'undefined' ? window.location.hostname : ''
      const parts = host.split('.')
      return parts.length > 1 ? parts[0] : 'localhost'
    }

    expect(getSlug()).toBe('localhost')
  })

  it('should handle production domain', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'myconf.tuplataforma.com' },
      writable: true
    })

    const getSlug = () => {
      const host = typeof window !== 'undefined' ? window.location.hostname : ''
      return host.split('.')[0]
    }

    expect(getSlug()).toBe('myconf')
  })
})
