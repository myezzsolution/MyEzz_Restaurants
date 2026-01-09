import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';
import { RestaurantProvider } from '../../context/RestaurantContext';
import styles from './Header.module.css';

// Helper function to render Header with context
const renderWithContext = (contextValue = {}) => {
  const defaultValue = {
    restaurantName: 'Test Restaurant',
    isOnline: false,
    setOnlineStatus: vi.fn(),
    ...contextValue
  };

  return render(
    <RestaurantProvider>
      <Header />
    </RestaurantProvider>
  );
};

describe('Header Component', () => {
  it('displays restaurant name correctly', () => {
    renderWithContext();
    
    // Test restaurant name display (Requirements 1.1)
    expect(screen.getByText('Demo Restaurant')).toBeInTheDocument();
  });

  it('displays offline status initially', () => {
    renderWithContext();
    
    // Test offline visual indicator (Requirements 2.1, 2.4)
    expect(screen.getByText('Offline')).toBeInTheDocument();
    
    const toggleButton = screen.getByRole('button', { name: /toggle restaurant online/i });
    expect(toggleButton).toHaveClass(styles.offline);
  });

  it('displays online status when toggled', () => {
    renderWithContext();
    
    const toggleButton = screen.getByRole('button', { name: /toggle restaurant online/i });
    
    // Click to toggle online
    fireEvent.click(toggleButton);
    
    // Test online visual indicator (Requirements 2.5)
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(toggleButton).toHaveClass(styles.online);
  });

  it('toggles between online and offline states', () => {
    renderWithContext();
    
    const toggleButton = screen.getByRole('button', { name: /toggle restaurant online/i });
    
    // Initial state should be offline
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(toggleButton).toHaveClass(styles.offline);
    
    // Click to go online
    fireEvent.click(toggleButton);
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(toggleButton).toHaveClass(styles.online);
    
    // Click to go offline again
    fireEvent.click(toggleButton);
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(toggleButton).toHaveClass(styles.offline);
  });

  it('has proper accessibility attributes', () => {
    renderWithContext();
    
    const toggleButton = screen.getByRole('button', { name: /toggle restaurant online/i });
    
    // Test accessibility
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle restaurant online');
    
    // After clicking, aria-label should update
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle restaurant offline');
  });

  it('has proper touch target sizing', () => {
    renderWithContext();
    
    const toggleButton = screen.getByRole('button', { name: /toggle restaurant online/i });
    
    // Test that the button has the toggle class which includes min-height: 44px
    expect(toggleButton).toHaveClass(styles.toggle);
    
    // Verify the button is rendered and clickable (functional touch target)
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).not.toBeDisabled();
  });
});