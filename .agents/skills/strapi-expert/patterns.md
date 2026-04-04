# Strapi v5 Advanced Patterns

## Lifecycle Hooks

### Plugin Lifecycle

```typescript
// server/src/register.ts - Runs before bootstrap
export default ({ strapi }: { strapi: Core.Strapi }) => {
  // Extend core services
  strapi.service('api::article.article').customMethod = async () => {
    // Custom logic
  };
};

// server/src/bootstrap.ts - Runs after all plugins registered
export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Seed data, set up listeners, etc.
  const existingSettings = await strapi
    .documents('plugin::my-plugin.settings')
    .findFirst();

  if (!existingSettings) {
    await strapi.documents('plugin::my-plugin.settings').create({
      data: { enabled: true },
    });
  }
};

// server/src/destroy.ts - Cleanup on shutdown
export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Close connections, cleanup resources
};
```

### Content-Type Lifecycle Hooks

```typescript
// server/src/content-types/article/lifecycles.ts
export default {
  async beforeCreate(event) {
    const { data } = event.params;
    // Modify data before creation
    if (!data.slug && data.title) {
      data.slug = slugify(data.title);
    }
  },

  async afterCreate(event) {
    const { result } = event;
    // Trigger side effects
    await strapi.service('plugin::my-plugin.notifications').send({
      type: 'new-article',
      articleId: result.documentId,
    });
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    // Validation or transformation
  },

  async afterUpdate(event) {
    const { result } = event;
    // Cache invalidation, webhooks, etc.
  },

  async beforeDelete(event) {
    const { where } = event.params;
    // Cleanup related data
  },

  async afterDelete(event) {
    // Post-deletion cleanup
  },
};
```

## Query Patterns

### Filtering

```typescript
// Complex filters
const articles = await strapi.documents('api::article.article').findMany({
  filters: {
    $and: [
      { publishedAt: { $notNull: true } },
      { title: { $containsi: 'strapi' } },
      {
        $or: [
          { category: { name: { $eq: 'Tech' } } },
          { featured: { $eq: true } },
        ],
      },
    ],
  },
});

// Filter operators
// $eq, $ne, $in, $notIn, $lt, $lte, $gt, $gte
// $contains, $containsi, $notContains, $notContainsi
// $startsWith, $endsWith, $null, $notNull
// $between, $and, $or, $not
```

### Population Strategies

```typescript
// Selective population
const article = await strapi.documents('api::article.article').findOne({
  documentId: 'abc123',
  populate: {
    author: {
      fields: ['username', 'email'],
    },
    categories: {
      fields: ['name', 'slug'],
      filters: { active: true },
    },
    cover: true, // Simple populate
  },
});

// Deep population
const article = await strapi.documents('api::article.article').findOne({
  documentId: 'abc123',
  populate: {
    author: {
      populate: {
        avatar: true,
        role: {
          fields: ['name'],
        },
      },
    },
  },
});

// Dynamic zone population
const page = await strapi.documents('api::page.page').findOne({
  documentId: 'xyz789',
  populate: {
    blocks: {
      on: {
        'blocks.hero': { populate: ['image'] },
        'blocks.rich-text': true,
        'blocks.cta': { populate: ['link'] },
      },
    },
  },
});
```

### Pagination

```typescript
// Offset pagination
const { results, pagination } = await strapi
  .documents('api::article.article')
  .findMany({
    status: 'published',
    limit: 10,
    start: 20,
  });

// In controllers, use pagination helper
async findMany(ctx) {
  const { page = 1, pageSize = 25 } = ctx.query;

  const start = (page - 1) * pageSize;
  const limit = Math.min(pageSize, 100); // Cap at 100

  const [results, total] = await Promise.all([
    strapi.documents('api::article.article').findMany({
      start,
      limit,
      status: 'published',
    }),
    strapi.documents('api::article.article').count({
      status: 'published',
    }),
  ]);

  return {
    data: results,
    meta: {
      pagination: {
        page,
        pageSize: limit,
        pageCount: Math.ceil(total / limit),
        total,
      },
    },
  };
}
```

## Middleware Patterns

### Global Middleware

```typescript
// server/src/middlewares/request-logger.ts
export default (config, { strapi }) => {
  return async (ctx, next) => {
    const start = Date.now();

    await next();

    const duration = Date.now() - start;
    strapi.log.info(`${ctx.method} ${ctx.url} - ${duration}ms`);
  };
};
```

### Route-Specific Middleware

```typescript
// In routes definition
{
  method: 'GET',
  path: '/items',
  handler: 'item.findMany',
  config: {
    middlewares: ['plugin::my-plugin.rate-limit'],
  },
}

// server/src/middlewares/rate-limit.ts
export default (config, { strapi }) => {
  const requests = new Map();

  return async (ctx, next) => {
    const ip = ctx.ip;
    const now = Date.now();
    const windowMs = config.windowMs || 60000;
    const max = config.max || 100;

    // Simple rate limiting logic
    const userRequests = requests.get(ip) || [];
    const recentRequests = userRequests.filter(t => now - t < windowMs);

    if (recentRequests.length >= max) {
      return ctx.throw(429, 'Too many requests');
    }

    recentRequests.push(now);
    requests.set(ip, recentRequests);

    await next();
  };
};
```

## Custom Field Pattern

```typescript
// server/src/register.ts
export default ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.customFields.register({
    name: 'color-picker',
    plugin: 'my-plugin',
    type: 'string',
    inputSize: {
      default: 4,
      isResizable: true,
    },
  });
};

// admin/src/index.tsx
app.customFields.register({
  name: 'color-picker',
  pluginId: 'my-plugin',
  type: 'string',
  intlLabel: {
    id: 'my-plugin.color-picker.label',
    defaultMessage: 'Color Picker',
  },
  intlDescription: {
    id: 'my-plugin.color-picker.description',
    defaultMessage: 'Select a color',
  },
  components: {
    Input: async () => import('./components/ColorPickerInput'),
  },
  options: {
    base: [
      {
        name: 'options.format',
        type: 'select',
        intlLabel: { id: 'color-picker.format', defaultMessage: 'Format' },
        options: [
          { value: 'hex', label: 'HEX' },
          { value: 'rgb', label: 'RGB' },
        ],
      },
    ],
  },
});
```

## Injection Zones

```typescript
// admin/src/index.tsx
export default {
  bootstrap(app) {
    // Inject into Content Manager edit view
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'my-plugin-preview',
      Component: () => import('./components/PreviewButton'),
    });

    // Inject into Content Manager list view
    app.getPlugin('content-manager').injectComponent('listView', 'actions', {
      name: 'my-plugin-bulk-action',
      Component: () => import('./components/BulkAction'),
    });
  },
};
```

## Service Composition Pattern

```typescript
// server/src/services/article.ts
const articleService = ({ strapi }: { strapi: Core.Strapi }) => ({
  // Core CRUD wrapping Document Service
  async findPublished(options = {}) {
    return strapi.documents('api::article.article').findMany({
      ...options,
      status: 'published',
    });
  },

  // Business logic methods
  async publishWithNotification(documentId: string) {
    const article = await strapi.documents('api::article.article').publish({
      documentId,
    });

    // Compose with other services
    await strapi.service('plugin::my-plugin.notification').send({
      type: 'article-published',
      data: article,
    });

    await strapi.service('plugin::my-plugin.cache').invalidate(`article:${documentId}`);

    return article;
  },

  // Aggregation methods
  async getStats() {
    const [total, published, draft] = await Promise.all([
      strapi.documents('api::article.article').count({}),
      strapi.documents('api::article.article').count({ status: 'published' }),
      strapi.documents('api::article.article').count({ status: 'draft' }),
    ]);

    return { total, published, draft };
  },
});

export default articleService;
```

## Error Handling Pattern

```typescript
// server/src/utils/errors.ts
import { errors } from '@strapi/utils';

const { ApplicationError, NotFoundError, ForbiddenError } = errors;

export class PluginError extends ApplicationError {
  constructor(message: string, details?: object) {
    super(message, details);
    this.name = 'PluginError';
  }
}

// Usage in controllers
async findOne(ctx) {
  const { id } = ctx.params;

  const item = await strapi.documents('plugin::my-plugin.item').findOne({
    documentId: id,
  });

  if (!item) {
    throw new NotFoundError(`Item with id ${id} not found`);
  }

  if (item.private && ctx.state.user?.id !== item.owner?.id) {
    throw new ForbiddenError('You do not have access to this item');
  }

  return { data: item };
}
```

## TypeScript Patterns

### Typed Services

```typescript
// server/src/services/index.ts
import type { Core } from '@strapi/strapi';
import itemService from './item';

export default {
  item: itemService,
};

// Type augmentation for strapi.service()
declare module '@strapi/strapi' {
  interface Services {
    'plugin::my-plugin.item': ReturnType<typeof itemService>;
  }
}
```

### Typed Content-Types

```typescript
// After running: strapi ts:generate-types
import type { Struct, Schema } from '@strapi/strapi';

// Auto-generated types in types/generated/contentTypes.d.ts
export interface PluginMyPluginItem extends Struct.CollectionTypeSchema {
  collectionName: 'items';
  info: {
    singularName: 'item';
    pluralName: 'items';
    displayName: 'Item';
  };
  attributes: {
    title: Schema.Attribute.String & Schema.Attribute.Required;
    slug: Schema.Attribute.UID<'title'>;
    content: Schema.Attribute.RichText;
  };
}
```

## Cron Jobs

```typescript
// server/src/config/index.ts
export default {
  default: {},
  validator: () => {},
};

// config/cron-tasks.ts (in main Strapi app)
export default {
  '*/5 * * * *': async ({ strapi }) => {
    // Run every 5 minutes
    await strapi.service('plugin::my-plugin.sync').run();
  },

  '0 0 * * *': async ({ strapi }) => {
    // Run daily at midnight
    await strapi.service('plugin::my-plugin.cleanup').oldDrafts();
  },
};
```

## Webhook Pattern

```typescript
// server/src/services/webhook.ts
const webhookService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async trigger(event: string, payload: object) {
    const settings = await strapi
      .documents('plugin::my-plugin.settings')
      .findFirst();

    if (!settings?.webhookUrl) {
      return;
    }

    try {
      await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });
    } catch (error) {
      strapi.log.error(`Webhook failed for event ${event}:`, error);
    }
  },
});

export default webhookService;
```

---

## React Query Pattern (plugin-todo)

The recommended approach for admin panel data fetching using `@tanstack/react-query`.

### Query Client Setup

```tsx
// admin/src/components/MyPanel.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const MyPanel = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MyContent />
    </QueryClientProvider>
  );
};
```

### Data Fetching with useQuery

```tsx
// admin/src/components/TaskList.tsx
import { useQuery } from '@tanstack/react-query';
import { useFetchClient, unstable_useContentManagerContext } from '@strapi/strapi/admin';

export const TaskList = () => {
  const { get } = useFetchClient();
  const { slug, id } = unstable_useContentManagerContext();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', slug, id],
    queryFn: () => get(`/todo/tasks/related/${slug}/${id}`).then((res) => res.data),
    enabled: !!id, // Only fetch when id exists
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading tasks</div>;

  return (
    <ul>
      {tasks?.map((task: any) => (
        <li key={task.id}>{task.name}</li>
      ))}
    </ul>
  );
};
```

### Mutations with Cache Invalidation

```tsx
// admin/src/components/TaskList.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFetchClient, unstable_useContentManagerContext } from '@strapi/strapi/admin';
import { Checkbox } from '@strapi/design-system';

export const TaskList = () => {
  const { get, put } = useFetchClient();
  const { slug, id } = unstable_useContentManagerContext();
  const queryClient = useQueryClient();

  const { data: tasks } = useQuery({
    queryKey: ['tasks', slug, id],
    queryFn: () => get(`/todo/tasks/related/${slug}/${id}`).then((res) => res.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (task: any) =>
      put(`/todo/tasks/${task.documentId}`, { data: { done: !task.done } }),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['tasks', slug, id] });
    },
  });

  return (
    <ul>
      {tasks?.map((task: any) => (
        <li key={task.id}>
          <Checkbox
            checked={task.done}
            onCheckedChange={() => toggleMutation.mutate(task)}
          >
            {task.name}
          </Checkbox>
        </li>
      ))}
    </ul>
  );
};
```

### Create Mutation with Modal

```tsx
// admin/src/components/TodoModal.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFetchClient, unstable_useContentManagerContext } from '@strapi/strapi/admin';
import { Dialog, TextInput, Button } from '@strapi/design-system';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const TodoModal = ({ open, setOpen }: Props) => {
  const [taskName, setTaskName] = useState('');
  const { post } = useFetchClient();
  const { id, model } = unstable_useContentManagerContext();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      post('/todo/tasks', {
        data: {
          name: taskName,
          related: [{ __type: model, id }],
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskName('');
      setOpen(false);
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Content>
        <Dialog.Header>Add Task</Dialog.Header>
        <Dialog.Body>
          <TextInput
            label="Task name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Cancel>
            <Button variant="tertiary">Cancel</Button>
          </Dialog.Cancel>
          <Dialog.Action>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!taskName || createMutation.isPending}
            >
              Confirm
            </Button>
          </Dialog.Action>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
```

## Content Manager Integration Pattern

### Injecting Components into Edit View

```typescript
// admin/src/index.ts
export default {
  bootstrap(app: any) {
    // Add panel to right sidebar of edit view
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'my-plugin-panel',
      Component: MyPanel,
    });
  },
};
```

### Available Injection Zones

| Zone | Location |
|------|----------|
| `editView.right-links` | Right sidebar of content edit view |
| `editView.informations` | Information panel in edit view |
| `listView.actions` | Actions area in list view |
| `listView.deleteModalAdditionalInfos` | Additional info in delete modal |

### Using Content Manager Context

```tsx
import { unstable_useContentManagerContext } from '@strapi/strapi/admin';

const MyComponent = () => {
  const {
    id,           // Current document ID (null if creating new)
    slug,         // Content type slug (e.g., 'api::article.article')
    model,        // Content type model name
    isCreatingEntry,
    hasDraftAndPublish,
  } = unstable_useContentManagerContext();

  return (
    <div>
      {id ? `Editing: ${id}` : 'Creating new entry'}
    </div>
  );
};
```

## Polymorphic Relations Pattern

### Schema with morphToMany

```json
{
  "attributes": {
    "related": {
      "type": "relation",
      "relation": "morphToMany"
    }
  }
}
```

### Querying Polymorphic Relations

```typescript
// server/src/services/task.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreService('plugin::todo.task', ({ strapi }) => ({
  async findRelatedTasks(relatedId: string, relatedType: string) {
    // Query the junction table directly
    const relatedTasks = await strapi.db
      .query('tasks_related_mph')
      .findMany({
        where: {
          related_id: relatedId,
          related_type: relatedType,
        },
      });

    const taskIds = relatedTasks.map((t) => t.task_id);

    // Fetch full task documents
    return strapi.documents('plugin::todo.task').findMany({
      filters: { id: { $in: taskIds } },
    });
  },
}));
```

### Creating with Polymorphic Relation

```typescript
// Creating a task related to an article
await strapi.documents('plugin::todo.task').create({
  data: {
    name: 'Review article',
    done: false,
    related: [
      {
        __type: 'api::article.article',
        id: articleId,
      },
    ],
  },
});
```

## Factory Pattern Deep Dive

### createCoreService

```typescript
import { factories } from '@strapi/strapi';

// Minimal - just use core CRUD
export default factories.createCoreService('plugin::my-plugin.item');

// Extended - add custom methods
export default factories.createCoreService('plugin::my-plugin.item', ({ strapi }) => ({
  // Custom method
  async findActive() {
    return strapi.documents('plugin::my-plugin.item').findMany({
      filters: { active: true },
    });
  },

  // Override core method
  async findOne(documentId: string) {
    const item = await super.findOne(documentId);
    // Add custom logic
    return { ...item, customField: 'value' };
  },
}));
```

### createCoreController

```typescript
import { factories } from '@strapi/strapi';

// Minimal - standard CRUD endpoints
export default factories.createCoreController('plugin::my-plugin.item');

// Extended - add custom endpoints
export default factories.createCoreController('plugin::my-plugin.item', ({ strapi }) => ({
  // Custom endpoint handler
  async findActive(ctx) {
    const items = await strapi
      .service('plugin::my-plugin.item')
      .findActive();

    ctx.body = { data: items };
  },

  // Override core endpoint
  async find(ctx) {
    // Add custom logic before
    const result = await super.find(ctx);
    // Add custom logic after
    return result;
  },
}));
```

### createCoreRouter

```typescript
import { factories } from '@strapi/strapi';

// Creates standard REST routes: GET, POST, GET/:id, PUT/:id, DELETE/:id
export default factories.createCoreRouter('plugin::my-plugin.item');

// The generated routes object has a .routes property that can be spread
// into custom route definitions
```

## Server Index Pattern (plugin-todo)

```typescript
// server/src/index.ts
import controllers from './controllers';
import routes from './routes';
import services from './services';
import contentTypes from './content-types';

export default {
  controllers,
  routes,
  services,
  contentTypes,
};
```

```typescript
// server/src/services/index.ts
import task from './task';

export default {
  task,
};
```

```typescript
// server/src/controllers/index.ts
import task from './task';

export default {
  task,
};
```

## Plugin Initializer Pattern

```tsx
// admin/src/components/Initializer.tsx
import { useEffect, useRef } from 'react';
import { PLUGIN_ID } from '../pluginId';

interface Props {
  setPlugin: (id: string) => void;
}

export const Initializer = ({ setPlugin }: Props) => {
  const ref = useRef(setPlugin);

  useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);

  return null;
};
```
