import React from 'react';

export interface NavItem {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  href: string;
}

export interface NavCategory {
  label: string;
  items: NavItem[];
}

export interface NavMenu {
  label: string;
  categories: NavCategory[];
}

export interface NavMenus {
  [key: string]: NavMenu;
}

export interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}

export interface FAQ {
  q: string;
  a: string;
}
