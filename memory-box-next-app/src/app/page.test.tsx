import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page (Dashboard)', () => {
  it('should render the page heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: /memory box/i })).toBeInTheDocument();
  });

  it('should render the page description', () => {
    render(<Home />);
    expect(screen.getByText(/memorize quotations using spaced repetition/i)).toBeInTheDocument();
  });

  it('should render all navigation cards', () => {
    render(<Home />);

    // Check for all card headings
    expect(screen.getByRole('heading', { name: /^all cards$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^review session$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^new card$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^box overview$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^dev tools$/i })).toBeInTheDocument();
  });

  it('should render card descriptions', () => {
    render(<Home />);

    expect(screen.getByText(/browse and manage your memory cards/i)).toBeInTheDocument();
    expect(screen.getByText(/review your cards due today/i)).toBeInTheDocument();
    expect(screen.getByText(/add a new quotation to memorize/i)).toBeInTheDocument();
    expect(screen.getByText(/view schedule levels and card counts/i)).toBeInTheDocument();
    expect(screen.getByText(/inject test cards for development/i)).toBeInTheDocument();
  });

  it('should have correct links for all navigation cards', () => {
    render(<Home />);

    const allCardsLink = screen.getByRole('link', { name: /all cards.*browse and manage/i });
    expect(allCardsLink).toHaveAttribute('href', '/cards');

    const reviewLink = screen.getByRole('link', { name: /review session.*review your cards/i });
    expect(reviewLink).toHaveAttribute('href', '/review');

    const newCardLink = screen.getByRole('link', { name: /new card.*add a new quotation/i });
    expect(newCardLink).toHaveAttribute('href', '/cards/new');

    const boxLink = screen.getByRole('link', { name: /box overview.*view schedule levels/i });
    expect(boxLink).toHaveAttribute('href', '/box');

    const devLink = screen.getByRole('link', { name: /dev tools.*inject test cards/i });
    expect(devLink).toHaveAttribute('href', '/dev');
  });

  it('should render 5 navigation cards', () => {
    const { container } = render(<Home />);

    // Count all Link elements (navigation cards)
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(5);
  });

  it('should apply proper styling classes', () => {
    const { container } = render(<Home />);

    // Check for grid layout
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });
});
