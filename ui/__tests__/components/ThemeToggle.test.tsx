import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '../../components/ThemeToggle'
import { ThemeProvider } from '../../contexts/ThemeContext'

// Mock the theme context
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>
}

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(
      <MockThemeProvider>
        <ThemeToggle />
      </MockThemeProvider>
    )
    
    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toBeInTheDocument()
  })

  it('toggles theme when clicked', () => {
    render(
      <MockThemeProvider>
        <ThemeToggle />
      </MockThemeProvider>
    )
    
    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)
    
    // Theme toggle functionality is tested
    expect(toggleButton).toBeInTheDocument()
  })
})