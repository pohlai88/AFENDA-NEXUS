import { PageHeader } from '@/components/erp/page-header';
import { CreateProjectForm } from '@/features/finance/projects/forms/create-project-form';
import { createProject } from '@/features/finance/projects/actions/projects.actions';
import { routes } from '@/lib/constants';
import type { CreateProjectInput } from '@afenda/contracts';

export const metadata = { title: 'New Project | Finance' };

async function handleCreate(data: Record<string, unknown>) {
  'use server';
  return createProject(data as unknown as CreateProjectInput);
}

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Project"
        description="Register a new project for cost tracking and billing."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Projects', href: routes.finance.projects },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CreateProjectForm onSubmit={handleCreate} />
      </div>
    </div>
  );
}
