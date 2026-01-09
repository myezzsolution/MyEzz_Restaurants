import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

describe('Navbar Component', () => {
  const renderNavbar = (initialPath = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Navbar />
      </MemoryRouter>
    );
  };

  describe('Navigation icon display', () => {
    it('displays all three navigation icons', () => {
      renderNavbar();

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Report')).toBeInTheDocument();
    });

    it('displays navigation icons with proper accessibility labels', () => {
      renderNavbar();

      expect(screen.getByLabelText('Navigate to Dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Report')).toBeInTheDocument();
    });

    it('displays navigation with proper ARIA attributes', () => {
      renderNavbar();

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });
  });

  describe('Active state highlighting', () => {
    it('highlights Dashboard as active when on root path', () => {
      renderNavbar('/');

      const dashboardLink = screen.getByLabelText('Navigate to Dashboard');
      const menuLink = screen.getByLabelText('Navigate to Menu');
      const reportLink = screen.getByLabelText('Navigate to Report');

      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
      expect(menuLink).not.toHaveAttribute('aria-current');
      expect(reportLink).not.toHaveAttribute('aria-current');
    });

    it('highlights Menu as active when on menu path', () => {
      renderNavbar('/menu');

      const dashboardLink = screen.getByLabelText('Navigate to Dashboard');
      const menuLink = screen.getByLabelText('Navigate to Menu');
      const reportLink = screen.getByLabelText('Navigate to Report');

      expect(menuLink).toHaveAttribute('aria-current', 'page');
      expect(dashboardLink).not.toHaveAttribute('aria-current');
      expect(reportLink).not.toHaveAttribute('aria-current');
    });

    it('highlights Report as active when on report path', () => {
      renderNavbar('/report');

      const dashboardLink = screen.getByLabelText('Navigate to Dashboard');
      const menuLink = screen.getByLabelText('Navigate to Menu');
      const reportLink = screen.getByLabelText('Navigate to Report');

      expect(reportLink).toHaveAttribute('aria-current', 'page');
      expect(dashboardLink).not.toHaveAttribute('aria-current');
      expect(menuLink).not.toHaveAttribute('aria-current');
    });

    it('applies active CSS class to current page link', () => {
      renderNavbar('/menu');

      const menuLink = screen.getByLabelText('Navigate to Menu');
      expect(menuLink.className).toContain('active');
    });
  });

  describe('Routing functionality', () => {
    it('has correct href attributes for all navigation links', () => {
      renderNavbar();

      const dashboardLink = screen.getByLabelText('Navigate to Dashboard');
      const menuLink = screen.getByLabelText('Navigate to Menu');
      const reportLink = screen.getByLabelText('Navigate to Report');

      expect(dashboardLink).toHaveAttribute('href', '/');
      expect(menuLink).toHaveAttribute('href', '/menu');
      expect(reportLink).toHaveAttribute('href', '/report');
    });

    it('renders exactly three navigation links', () => {
      renderNavbar();

      const navLinks = screen.getAllByRole('link');
      expect(navLinks).toHaveLength(3);
    });

    it('maintains navigation structure regardless of current path', () => {
      const paths = ['/', '/menu', '/report'];
      
      paths.forEach(path => {
        const { unmount } = renderNavbar(path);
        
        // Verify all navigation items are present
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Menu')).toBeInTheDocument();
        expect(screen.getByText('Report')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Touch target sizing', () => {
    it('applies proper CSS classes for touch-friendly interaction', () => {
      renderNavbar();

      const navLinks = screen.getAllByRole('link');
      navLinks.forEach(link => {
        expect(link.className).toContain('navLink');
      });
    });
  });
});