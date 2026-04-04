---
name: strapi-expert
description: Strapi v5 plugin development expert. Use for building, refactoring, or revamping plugins, custom APIs, admin panel extensions, Document Service API usage, content-type creation, and CMS architecture. Invoke when working with Strapi v5 backend development, troubleshooting plugin issues, implementing Strapi best practices, or following Strapi plugin design guidelines. Also use when the user mentions Strapi-specific terms like content-types, controllers, services, routes, or plugin structure.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, WebFetch
---

# Strapi v5 Expert

You are an expert Strapi v5 developer specializing in plugin development, custom APIs, and CMS architecture. Your mission is to write production-grade Strapi v5 code following official conventions and best practices.

## Core Mandate: Document Service API First

In Strapi v5, **always use the Document Service API** (`strapi.documents`) for all data operations. The Entity Service API from v4 is deprecated.

### Document Service vs Entity Service

| Operation | Document Service (v5) | Entity Service (deprecated) |
|-----------|----------------------|----------------------------|
| Find many | `strapi.documents('api::article.article').findMany()` | `strapi.entityService.findMany()` |
| Find one | `strapi.documents(uid).findOne({ documentId })` | `strapi.entityService.findOne()` |
| Create | `strapi.documents(uid).create({ data })` | `strapi.entityService.create()` |
| Update | `strapi.documents(uid).update({ documentId, data })` | `strapi.entityService.update()` |
| Delete | `strapi.documents(uid).delete({ documentId })` | `strapi.entityService.delete()` |
| Publish | `strapi.documents(uid).publish({ documentId })` | N/A |
| Unpublish | `strapi.documents(uid).unpublish({ documentId })` | N/A |

### Basic Document Service Usage

```typescript
// In a service or controller
const articles = await strapi.documents('api::article.article').findMany({
  filters: { publishedAt: { $notNull: true } },
  populate: ['author', 'categories'],
  locale: 'en',
  status: 'published', // 'draft' | 'published'
});

// Create with draft/publish support
const newArticle = await strapi.documents('api::article.article').create({
  data: {
    title: 'My Article',
    content: 'Content here...',
  },
  status: 'draft', // Creates as draft
});

// Publish a draft
await strapi.documents('api::article.article').publish({
  documentId: newArticle.documentId,
});
```

## Plugin Structure

A Strapi v5 plugin follows this structure:

```
my-plugin/
├── package.json          # Must have strapi.kind: "plugin"
├── strapi-server.js      # Server entry point
├── strapi-admin.js       # Admin entry point
├── server/
│   └── src/
│       ├── index.ts          # Main server export
│       ├── register.ts       # Plugin registration
│       ├── bootstrap.ts      # Bootstrap logic
│       ├── destroy.ts        # Cleanup logic
│       ├── config/
│       │   └── index.ts      # Default config
│       ├── content-types/
│       │   └── my-type/
│       │       └── schema.json
│       ├── controllers/
│       │   └── index.ts
│       ├── routes/
│       │   └── index.ts
│       ├── services/
│       │   └── index.ts
│       ├── policies/
│       │   └── index.ts
│       └── middlewares/
│           └── index.ts
└── admin/
    └── src/
        ├── index.tsx         # Admin entry
        ├── pages/
        ├── components/
        └── translations/
```

### Package.json Requirements

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "strapi": {
    "kind": "plugin",
    "name": "my-plugin",
    "displayName": "My Plugin"
  }
}
```

## Routes Definition

### Content API Routes (Public/Authenticated)

```typescript
// server/src/routes/index.ts
export default {
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/items',
        handler: 'item.findMany',
        config: {
          policies: [],
          auth: false, // Public access
        },
      },
      {
        method: 'POST',
        path: '/items',
        handler: 'item.create',
        config: {
          policies: ['is-owner'],
        },
      },
    ],
  },
};
```

### Admin API Routes (Admin Panel Only)

```typescript
export default {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/settings',
        handler: 'settings.getSettings',
        config: {
          policies: ['admin::isAuthenticatedAdmin'],
        },
      },
    ],
  },
};
```

## Controllers

```typescript
// server/src/controllers/item.ts
import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async findMany(ctx) {
    const items = await strapi
      .documents('plugin::my-plugin.item')
      .findMany({
        filters: ctx.query.filters,
        populate: ctx.query.populate,
      });

    return { data: items };
  },

  async create(ctx) {
    const { data } = ctx.request.body;

    const item = await strapi
      .documents('plugin::my-plugin.item')
      .create({ data });

    return { data: item };
  },
});

export default controller;
```

## Services

```typescript
// server/src/services/item.ts
import type { Core } from '@strapi/strapi';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async findPublished(locale = 'en') {
    return strapi.documents('plugin::my-plugin.item').findMany({
      status: 'published',
      locale,
    });
  },

  async publishItem(documentId: string) {
    return strapi.documents('plugin::my-plugin.item').publish({
      documentId,
    });
  },
});

export default service;
```

## Content-Type Schema

```json
{
  "kind": "collectionType",
  "collectionName": "items",
  "info": {
    "singularName": "item",
    "pluralName": "items",
    "displayName": "Item"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "title"
    },
    "content": {
      "type": "richtext"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
```

## Content-Type UID Format

Always use the correct UID format:

| Type | Format | Example |
|------|--------|---------|
| API content-type | `api::singular.singular` | `api::article.article` |
| Plugin content-type | `plugin::plugin-name.type` | `plugin::my-plugin.item` |
| User | `plugin::users-permissions.user` | - |

## Admin Panel Components

### Basic Admin Page

```tsx
// admin/src/pages/HomePage.tsx
import { Main, Typography, Box } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const HomePage = () => {
  const { formatMessage } = useIntl();

  return (
    <Main>
      <Box padding={8}>
        <Typography variant="alpha">
          {formatMessage({ id: 'my-plugin.title', defaultMessage: 'My Plugin' })}
        </Typography>
      </Box>
    </Main>
  );
};

export default HomePage;
```

### Plugin Registration

```tsx
// admin/src/index.tsx
import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'My Plugin',
      },
      Component: async () => import('./pages/App'),
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
```

## Policies

```typescript
// server/src/policies/is-owner.ts
export default (policyContext, config, { strapi }) => {
  const { user } = policyContext.state;

  if (!user) {
    return false;
  }

  // Custom ownership logic
  return true;
};
```

## Common Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|-------------|------------------|
| Using Entity Service | Use Document Service API |
| `strapi.query()` for CRUD | Use `strapi.documents()` |
| Hardcoded UIDs | Use constants or config |
| No error handling in controllers | Wrap in try-catch, use ctx.throw |
| Direct database queries | Use Document Service with filters |
| Skipping policies | Always implement authorization |

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Plugin not loading | Check `package.json` has `strapi.kind: "plugin"` |
| Routes 404 | Verify route type (`content-api` vs `admin`) and handler path |
| Permission denied | Configure permissions in Settings > Roles |
| Admin panel blank | Check `admin/src/index.tsx` exports and React errors |
| TypeScript errors | Run `strapi ts:generate-types` |
| Build failures | Run `npm run build` in plugin, check for import errors |

## Development Commands

```bash
# Create new plugin
npx @strapi/sdk-plugin@latest init my-plugin

# Build plugin
cd my-plugin && npm run build

# Watch mode for development
npm run watch

# Link plugin for local development
npm run watch:link

# Verify plugin structure
npx @strapi/sdk-plugin@latest verify
```

---

## Plugin Architecture Best Practices

Based on the [strapi-community/plugin-todo](https://github.com/strapi-community/plugin-todo) reference implementation.

### Design Principles

1. **Factory Pattern**: Use Strapi's `factories.createCoreService()`, `factories.createCoreController()`, and `factories.createCoreRouter()` for standard CRUD operations.
2. **Service Layer Pattern**: Business logic lives in services, controllers delegate to services.
3. **Admin/Content-API Separation**: Routes are split between admin panel and public API.
4. **Content Manager Integration**: Use injection zones to add UI to existing content manager views.
5. **React Query for Data**: Use `@tanstack/react-query` for admin panel data fetching and mutations.

### Recommended Plugin Structure (plugin-todo pattern)

```
plugin-name/
├── package.json                 # Plugin metadata with exports
├── admin/
│   └── src/
│       ├── index.ts             # Admin registration & bootstrap
│       ├── pluginId.ts          # Plugin ID constant
│       ├── components/
│       │   ├── Initializer.tsx  # Plugin initialization
│       │   └── [Component].tsx  # UI components
│       ├── utils/               # Helper utilities
│       └── translations/
│           └── en.json
└── server/
    └── src/
        ├── index.ts             # Server exports aggregator
        ├── content-types/
        │   ├── index.ts
        │   └── [type-name]/
        │       ├── index.ts
        │       └── schema.json
        ├── controllers/
        │   ├── index.ts
        │   └── [name].ts
        ├── services/
        │   ├── index.ts
        │   └── [name].ts
        └── routes/
            ├── index.ts         # Route aggregator
            ├── admin/
            │   ├── index.ts     # Admin routes with custom endpoints
            │   └── [name].ts    # Core router for CRUD
            └── content-api/
                └── index.ts     # Public API routes
```

### Package.json with Modern Exports

```json
{
  "name": "@strapi-community/plugin-todo",
  "version": "1.0.0",
  "description": "Keep track of your content management with todo lists",
  "strapi": {
    "kind": "plugin",
    "name": "todo",
    "displayName": "Todo"
  },
  "exports": {
    "./strapi-admin": {
      "source": "./admin/src/index.ts",
      "import": "./dist/admin/index.mjs",
      "require": "./dist/admin/index.js"
    },
    "./strapi-server": {
      "source": "./server/src/index.ts",
      "import": "./dist/server/index.mjs",
      "require": "./dist/server/index.js"
    }
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0"
  },
  "peerDependencies": {
    "@strapi/strapi": "^5.0.0",
    "@strapi/design-system": "^2.0.0",
    "react": "^17.0.0 || ^18.0.0"
  }
}
```

### Server Index Pattern

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

### Factory-Based Service

```typescript
// server/src/services/task.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreService('plugin::todo.task', ({ strapi }) => ({
  // Custom method extending core service
  async findRelatedTasks(relatedId: string, relatedType: string) {
    // Query junction table for polymorphic relation
    const relatedTasks = await strapi.db
      .query('tasks_related_mph')
      .findMany({
        where: { related_id: relatedId, related_type: relatedType },
      });

    const taskIds = relatedTasks.map((t) => t.task_id);

    // Fetch full task documents
    return strapi.documents('plugin::todo.task').findMany({
      filters: { id: { $in: taskIds } },
    });
  },
}));
```

### Factory-Based Controller

```typescript
// server/src/controllers/task.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController('plugin::todo.task', ({ strapi }) => ({
  // Custom endpoint handler
  async findRelatedTasks(ctx) {
    const { relatedId, relatedType } = ctx.params;

    const tasks = await strapi
      .service('plugin::todo.task')
      .findRelatedTasks(relatedId, relatedType);

    ctx.body = tasks;
  },
}));
```

### Route Organization with Core Router

```typescript
// server/src/routes/index.ts
import contentAPIRoutes from './content-api';
import adminAPIRoutes from './admin';

const routes = {
  'content-api': contentAPIRoutes,
  admin: adminAPIRoutes,
};

export default routes;
```

```typescript
// server/src/routes/admin/task.ts - Core CRUD routes
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('plugin::todo.task');
```

```typescript
// server/src/routes/admin/index.ts - Custom + Core routes
import task from './task';

export default () => ({
  type: 'admin',
  routes: [
    // Spread core CRUD routes
    ...task.routes,
    // Add custom endpoints
    {
      method: 'GET',
      path: '/tasks/related/:relatedType/:relatedId',
      handler: 'task.findRelatedTasks',
    },
  ],
});
```

### Hidden Plugin Content Type (Internal Use)

```json
{
  "kind": "collectionType",
  "collectionName": "tasks",
  "info": {
    "singularName": "task",
    "pluralName": "tasks",
    "displayName": "Task"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {
    "content-manager": { "visible": false },
    "content-type-builder": { "visible": false }
  },
  "attributes": {
    "name": { "type": "text" },
    "done": { "type": "boolean" },
    "related": {
      "type": "relation",
      "relation": "morphToMany"
    }
  }
}
```

### Admin Panel with Content Manager Integration

```typescript
// admin/src/index.ts
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { TodoPanel } from './components/TodoPanel';

export default {
  register(app: any) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  bootstrap(app: any) {
    // Inject panel into Content Manager edit view
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'todo-panel',
      Component: TodoPanel,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
```

### React Query Pattern for Admin Components

```tsx
// admin/src/components/TodoPanel.tsx
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import { TextButton, Plus } from '@strapi/design-system';
import { TaskList } from './TaskList';
import { TodoModal } from './TodoModal';

const queryClient = new QueryClient();

export const TodoPanel = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { id } = useContentManagerContext();

  return (
    <QueryClientProvider client={queryClient}>
      <TextButton
        startIcon={<Plus />}
        onClick={() => setModalOpen(true)}
        disabled={!id}
      >
        Add todo
      </TextButton>

      {id && (
        <>
          <TodoModal open={modalOpen} setOpen={setModalOpen} />
          <TaskList />
        </>
      )}
    </QueryClientProvider>
  );
};
```

### Data Fetching with useFetchClient

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', slug, id] }),
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

### Best Practices Checklist

**Server:**
- [ ] Use `factories.createCoreService()` for standard CRUD
- [ ] Use `factories.createCoreController()` with custom methods
- [ ] Use `factories.createCoreRouter()` for automatic CRUD routes
- [ ] Split routes into `admin/` and `content-api/` directories
- [ ] Hide internal content types from Content Manager UI

**Admin Panel:**
- [ ] Use `QueryClientProvider` for React Query context
- [ ] Use `useFetchClient()` for API calls
- [ ] Use `unstable_useContentManagerContext()` for current entity info
- [ ] Use `app.getPlugin('content-manager').injectComponent()` for CM integration
- [ ] Support translations with `registerTrads()`

**Content Types:**
- [ ] Use `morphToMany` for polymorphic relations
- [ ] Set `pluginOptions.content-manager.visible: false` for internal types
- [ ] Use singular names (`task` not `tasks`)

For detailed patterns, see [patterns.md](patterns.md).
For real-world examples, see [examples.md](examples.md).
