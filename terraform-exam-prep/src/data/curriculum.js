import c01 from '../../notes/01-use-cases.md?raw'
import c02 from '../../notes/02-core-and-plugins.md?raw'
import c03 from '../../notes/03-install.md?raw'
import c04 from '../../notes/04-up-and-running.md?raw'
import c05 from '../../notes/05-cli-and-configuration.md?raw'
import c06 from '../../notes/06-terraform-lifecycle.md?raw'
import c07 from '../../notes/07-init.md?raw'
import c08 from '../../notes/08-plan-and-apply.md?raw'
import c09 from '../../notes/09-execution-plans.md?raw'
import c10 from '../../notes/10-visualizing-execution-plans.md?raw'
import c11 from '../../notes/11-resource-graph.md?raw'
import c12 from '../../notes/12-change-automation.md?raw'
import c13 from '../../notes/13-apply-update.md?raw'
import c14 from '../../notes/14-input-variables.md?raw'
import c15 from '../../notes/15-local-values.md?raw'
import c16 from '../../notes/16-outputs.md?raw'
import c17 from '../../notes/17-divide-files.md?raw'
import c18 from '../../notes/18-modules.md?raw'
import c19 from '../../notes/19-best-practices.md?raw'
import c20 from '../../notes/20-destroy.md?raw'
import c21 from '../../notes/21-cloud.md?raw'
import c22 from '../../notes/22-cloud-updated.md?raw'
import c23 from '../../notes/23-cleanup.md?raw'

export const MODULES = [
  {
    id: 'module-1',
    title: 'Why Terraform?',
    topics: [
      { id: '01', slug: '01-use-cases', title: 'Use Cases', content: c01 },
      { id: '02', slug: '02-core-and-plugins', title: 'Core and Plugins', content: c02 },
    ],
  },
  {
    id: 'module-2',
    title: 'Getting Started',
    topics: [
      { id: '03', slug: '03-install', title: 'Install', content: c03 },
      { id: '04', slug: '04-up-and-running', title: 'Up and Running', content: c04 },
      { id: '05', slug: '05-cli-and-configuration', title: 'CLI and Configuration', content: c05 },
    ],
  },
  {
    id: 'module-3',
    title: 'The Core Workflow',
    topics: [
      { id: '06', slug: '06-terraform-lifecycle', title: 'Terraform Lifecycle', content: c06 },
      { id: '07', slug: '07-init', title: 'Init', content: c07 },
      { id: '08', slug: '08-plan-and-apply', title: 'Plan and Apply', content: c08 },
    ],
  },
  {
    id: 'module-4',
    title: 'Change Management',
    topics: [
      { id: '09', slug: '09-execution-plans', title: 'Execution Plans', content: c09 },
      { id: '10', slug: '10-visualizing-execution-plans', title: 'Visualizing Execution Plans', content: c10 },
      { id: '11', slug: '11-resource-graph', title: 'Resource Graph', content: c11 },
      { id: '12', slug: '12-change-automation', title: 'Change Automation', content: c12 },
      { id: '13', slug: '13-apply-update', title: 'Apply Update', content: c13 },
    ],
  },
  {
    id: 'module-5',
    title: 'Configuration Language',
    topics: [
      { id: '14', slug: '14-input-variables', title: 'Input Variables', content: c14 },
      { id: '15', slug: '15-local-values', title: 'Local Values', content: c15 },
      { id: '16', slug: '16-outputs', title: 'Outputs', content: c16 },
      { id: '17', slug: '17-divide-files', title: 'Divide Files', content: c17 },
      { id: '18', slug: '18-modules', title: 'Modules', content: c18 },
    ],
  },
  {
    id: 'module-6',
    title: 'Operations and Maintenance',
    topics: [
      { id: '19', slug: '19-best-practices', title: 'Best Practices', content: c19 },
      { id: '20', slug: '20-destroy', title: 'Destroy', content: c20 },
    ],
  },
  {
    id: 'module-7',
    title: 'HCP Terraform (Cloud)',
    topics: [
      { id: '21', slug: '21-cloud', title: 'Cloud', content: c21 },
      { id: '22', slug: '22-cloud-updated', title: 'Cloud Updated', content: c22 },
      { id: '23', slug: '23-cleanup', title: 'Cleanup', content: c23 },
    ],
  },
]

export const ALL_TOPICS = MODULES.flatMap(m => m.topics)
