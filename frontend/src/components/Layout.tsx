import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Breadcrumb } from './Breadcrumb';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface LayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function Layout({ children, title, breadcrumbs }: LayoutProps) {
  return (
    <>
      <Navbar title={title} />
      <div className="container mt-4">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
        {children}
      </div>
    </>
  );
}
