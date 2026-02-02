import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OfflinePage from './page';

describe('Offline Page', () => {
  it('should render the page heading', () => {
    render(<OfflinePage />);
    expect(screen.getByRole('heading', { level: 1, name: /you're offline/i })).toBeInTheDocument();
  });

  it('should render the main description', () => {
    render(<OfflinePage />);
    expect(
      screen.getByText(
        /it looks like you're not connected to the internet.*memory box works offline/i
      )
    ).toBeInTheDocument();
  });

  it('should render the offline icon', () => {
    const { container } = render(<OfflinePage />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-24', 'w-24');
  });

  it('should render "What you can do offline" section heading', () => {
    render(<OfflinePage />);
    expect(
      screen.getByRole('heading', { level: 2, name: /what you can do offline/i })
    ).toBeInTheDocument();
  });

  it('should list all offline capabilities', () => {
    render(<OfflinePage />);

    expect(screen.getByText(/review your memory cards/i)).toBeInTheDocument();
    expect(screen.getByText(/create new cards/i)).toBeInTheDocument();
    expect(screen.getByText(/edit existing cards/i)).toBeInTheDocument();
    expect(screen.getByText(/browse your box overview/i)).toBeInTheDocument();
  });

  it('should render 4 capability items', () => {
    const { container } = render(<OfflinePage />);
    const checkmarks = container.querySelectorAll('svg path[d*="M5 13l4 4L19 7"]');
    expect(checkmarks).toHaveLength(4);
  });

  it('should render the footer message about local storage', () => {
    render(<OfflinePage />);
    expect(
      screen.getByText(
        /all your data is stored locally on your device.*when you reconnect to the internet/i
      )
    ).toBeInTheDocument();
  });

  it('should apply proper styling classes', () => {
    const { container } = render(<OfflinePage />);

    // Check for container classes
    const mainContainer = container.querySelector('.container');
    expect(mainContainer).toBeInTheDocument();

    // Check for text-center class
    const centerText = container.querySelector('.text-center');
    expect(centerText).toBeInTheDocument();
  });

  it('should render capability list with proper spacing', () => {
    const { container } = render(<OfflinePage />);
    const list = container.querySelector('.space-y-2');
    expect(list).toBeInTheDocument();
  });

  it('should have information panel with proper styling', () => {
    const { container } = render(<OfflinePage />);
    const infoPanel = container.querySelector('.bg-indigo-50');
    expect(infoPanel).toBeInTheDocument();
  });
});
