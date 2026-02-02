import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BoxPage from './page';

// Mock the BoxOverview component
vi.mock('@/components/box', () => ({
  BoxOverview: () => <div data-testid="box-overview">Box Overview Component</div>,
}));

describe('Box Page', () => {
  it('should render the page heading', () => {
    render(<BoxPage />);
    expect(screen.getByRole('heading', { level: 1, name: /box overview/i })).toBeInTheDocument();
  });

  it('should render the page description', () => {
    render(<BoxPage />);
    expect(
      screen.getByText(
        /view all your memory cards organized by their review schedules.*cards highlighted in blue are due for review today/i
      )
    ).toBeInTheDocument();
  });

  it('should render BoxOverview component', () => {
    render(<BoxPage />);
    expect(screen.getByTestId('box-overview')).toBeInTheDocument();
  });

  it('should apply correct container styling', () => {
    const { container } = render(<BoxPage />);
    const mainContainer = container.querySelector('.mx-auto');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('max-w-7xl');
  });

  it('should have proper spacing for header', () => {
    const { container } = render(<BoxPage />);
    const header = container.querySelector('.mb-8');
    expect(header).toBeInTheDocument();
  });
});
