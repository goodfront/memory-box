import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  describe('Basic Rendering', () => {
    it('should render the logo/brand', () => {
      render(<Header />);
      expect(screen.getByText('Memory Box')).toBeInTheDocument();
    });

    it('should render brand as a link to home', () => {
      render(<Header />);
      const brandLink = screen.getByRole('link', { name: /memory box/i });
      expect(brandLink).toHaveAttribute('href', '/');
    });

    it('should render all navigation links', () => {
      render(<Header />);

      expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^box$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^cards$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^review$/i })).toBeInTheDocument();
    });

    it('should have correct href attributes for navigation links', () => {
      render(<Header />);

      expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /^box$/i })).toHaveAttribute('href', '/box');
      expect(screen.getByRole('link', { name: /^cards$/i })).toHaveAttribute('href', '/cards');
      expect(screen.getByRole('link', { name: /^review$/i })).toHaveAttribute('href', '/review');
    });
  });

  describe('Active Link Highlighting', () => {
    it('should highlight home link when on home page', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Header />);

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toHaveClass('text-indigo-600');
    });

    it('should highlight box link when on box page', () => {
      mockUsePathname.mockReturnValue('/box');
      render(<Header />);

      const boxLink = screen.getByRole('link', { name: /^box$/i });
      expect(boxLink).toHaveClass('text-indigo-600');
    });

    it('should highlight cards link when on cards page', () => {
      mockUsePathname.mockReturnValue('/cards');
      render(<Header />);

      const cardsLink = screen.getByRole('link', { name: /^cards$/i });
      expect(cardsLink).toHaveClass('text-indigo-600');
    });

    it('should highlight cards link when on cards subpages', () => {
      mockUsePathname.mockReturnValue('/cards/new');
      render(<Header />);

      const cardsLink = screen.getByRole('link', { name: /^cards$/i });
      expect(cardsLink).toHaveClass('text-indigo-600');
    });

    it('should highlight review link when on review page', () => {
      mockUsePathname.mockReturnValue('/review');
      render(<Header />);

      const reviewLink = screen.getByRole('link', { name: /^review$/i });
      expect(reviewLink).toHaveClass('text-indigo-600');
    });

    it('should not highlight home link when on other pages', () => {
      mockUsePathname.mockReturnValue('/box');
      render(<Header />);

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).not.toHaveClass('text-indigo-600');
      expect(homeLink).toHaveClass('text-zinc-600');
    });
  });

  describe('Mobile Menu', () => {
    it('should render mobile menu button', () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle menu/i);
      expect(menuButton).toBeInTheDocument();
    });

    it('should not show mobile menu by default', () => {
      render(<Header />);

      // Mobile menu items should not be visible initially
      const mobileMenuContainer = document.querySelector('.md\\:hidden.border-t');
      expect(mobileMenuContainer).not.toBeInTheDocument();
    });

    it('should show mobile menu when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle menu/i);
      await user.click(menuButton);

      // Mobile menu should be visible
      const mobileMenuContainer = document.querySelector('.md\\:hidden.border-t');
      expect(mobileMenuContainer).toBeInTheDocument();
    });

    it('should hide mobile menu when button is clicked again', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle menu/i);

      // Open menu
      await user.click(menuButton);
      expect(document.querySelector('.md\\:hidden.border-t')).toBeInTheDocument();

      // Close menu
      await user.click(menuButton);
      expect(document.querySelector('.md\\:hidden.border-t')).not.toBeInTheDocument();
    });

    it('should close mobile menu when a link is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle menu/i);

      // Open menu
      await user.click(menuButton);
      expect(document.querySelector('.md\\:hidden.border-t')).toBeInTheDocument();

      // Click a link in the mobile menu
      const mobileLinks = screen.getAllByRole('link', { name: /^home$/i });
      const mobileHomeLink = mobileLinks.find((link) =>
        link.closest('.md\\:hidden')
      );

      if (mobileHomeLink) {
        await user.click(mobileHomeLink);
        expect(document.querySelector('.md\\:hidden.border-t')).not.toBeInTheDocument();
      }
    });

    it('should show hamburger icon when menu is closed', () => {
      const { container } = render(<Header />);

      // Look for the hamburger icon (three horizontal lines)
      const hamburgerPath = container.querySelector(
        'path[d*="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"]'
      );
      expect(hamburgerPath).toBeInTheDocument();
    });

    it('should show X icon when menu is open', async () => {
      const user = userEvent.setup();
      const { container } = render(<Header />);

      const menuButton = screen.getByLabelText(/toggle menu/i);
      await user.click(menuButton);

      // Look for the X icon (close icon)
      const closeIconPath = container.querySelector('path[d*="M6 18L18 6M6 6l12 12"]');
      expect(closeIconPath).toBeInTheDocument();
    });
  });

  describe('Desktop vs Mobile Navigation', () => {
    it('should have desktop navigation with proper class', () => {
      const { container } = render(<Header />);

      const desktopNav = container.querySelector('.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    it('should render navigation items in both desktop and mobile menus', async () => {
      const user = userEvent.setup();
      render(<Header />);

      // Open mobile menu
      const menuButton = screen.getByLabelText(/toggle menu/i);
      await user.click(menuButton);

      // Should have links in desktop menu (hidden on mobile)
      const allHomeLinks = screen.getAllByRole('link', { name: /^home$/i });
      expect(allHomeLinks.length).toBeGreaterThanOrEqual(2); // One in desktop, one in mobile
    });
  });

  describe('Styling and Accessibility', () => {
    it('should apply sticky positioning to header', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0');
    });

    it('should have proper z-index for layering', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('z-50');
    });

    it('should have backdrop blur effect', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('backdrop-blur');
    });

    it('should have proper border styling', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('border-b');
    });

    it('should have aria-label on mobile menu button', () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/toggle menu/i);
      expect(menuButton).toHaveAttribute('aria-label', 'Toggle menu');
    });
  });

  describe('Active State in Mobile Menu', () => {
    it('should highlight active link in mobile menu', async () => {
      const user = userEvent.setup();
      mockUsePathname.mockReturnValue('/cards');

      render(<Header />);

      // Open mobile menu
      const menuButton = screen.getByLabelText(/toggle menu/i);
      await user.click(menuButton);

      // Find the Cards link in mobile menu
      const allCardsLinks = screen.getAllByRole('link', { name: /^cards$/i });
      const mobileCardsLink = allCardsLinks.find((link) =>
        link.className.includes('bg-indigo-50')
      );

      expect(mobileCardsLink).toBeInTheDocument();
      expect(mobileCardsLink).toHaveClass('text-indigo-600');
    });
  });
});
