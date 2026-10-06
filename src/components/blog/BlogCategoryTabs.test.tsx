// @vitest-environment jsdom

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, afterEach } from 'vitest';
import BlogCategoryTabs, { type PostCategoryData } from './BlogCategoryTabs';

afterEach(cleanup);

const mockCategories: PostCategoryData[] = [
  {
    id: 184,
    name: 'Printer Setup & Installation',
    slug: 'printer-setup-installation',
    post_count: 1,
    children: [
      { id: 193, parent_id: 184, name: 'sub printer', slug: 'sub-printer', post_count: 0 },
      { id: 194, parent_id: 184, name: 'sub installation', slug: 'sub-installation', post_count: 2 },
    ],
  },
  {
    id: 185,
    name: 'Materials & Substrates',
    slug: 'materials-substrates',
    post_count: 1,
    children: [],
  },
  {
    id: 186,
    name: 'Print Configuration',
    slug: 'print-configuration',
    post_count: 0,
    children: [],
  },
];

describe('BlogCategoryTabs Component', () => {
  it('renders "Alle" and all root categories', () => {
    render(
      <BlogCategoryTabs
        categories={mockCategories}
        activeCategory="all"
        locale="nl"
        allLabel="Alle"
      />
    );

    expect(screen.getByText('Alle')).toBeDefined();
    expect(screen.getByText('Printer Setup & Installation')).toBeDefined();
    expect(screen.getByText('Materials & Substrates')).toBeDefined();
    expect(screen.getByText('Print Configuration')).toBeDefined();
  });

  it('renders chevron icon button only for categories with subcategories', () => {
    render(
      <BlogCategoryTabs
        categories={mockCategories}
        activeCategory="all"
        locale="nl"
        allLabel="Alle"
      />
    );

    const chevronButton = screen.queryByRole('button', {
      name: /Toggle Printer Setup & Installation subcategories/i,
    });
    expect(chevronButton).not.toBeNull();

    const nonExistentChevron = screen.queryByRole('button', {
      name: /Toggle Materials & Substrates subcategories/i,
    });
    expect(nonExistentChevron).toBeNull();
  });

  it('opens dropdown and displays subcategories when clicking or hovering', async () => {
    render(
      <BlogCategoryTabs
        categories={mockCategories}
        activeCategory="all"
        locale="nl"
        allLabel="Alle"
      />
    );

    const chevronButton = screen.getByRole('button', {
      name: /Toggle Printer Setup & Installation subcategories/i,
    });
    fireEvent.click(chevronButton);

    expect(await screen.findByText('sub printer')).toBeDefined();
    expect(screen.getByText('sub installation')).toBeDefined();
  });

  it('highlights parent tab when a subcategory is active', () => {
    render(
      <BlogCategoryTabs
        categories={mockCategories}
        activeCategory="sub-printer"
        locale="nl"
        allLabel="Alle"
      />
    );

    const parentLink = screen.getByRole('link', { name: /Printer Setup & Installation/i });
    expect(parentLink.className).toContain('text-brand');
    expect(parentLink.className).toContain('font-bold');
  });
});
