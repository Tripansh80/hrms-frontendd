export const qk = {
  me: () => ["me"],
  employees: {
    list: (filters?: Record<string, unknown>) => ["employees", "list", filters ?? {}],
    detail: (id: string) => ["employees", "detail", id],
  },
  leave: {
    list: (filters?: Record<string, unknown>) => ["leave", "list", filters ?? {}],
    detail: (id: string) => ["leave", "detail", id],
    balances: () => ["leave", "balances"],
    types: () => ["leave", "types"],
  },
  attendance: {
    list: (filters?: Record<string, unknown>) => ["attendance", "list", filters ?? {}],
    summary: (month: string) => ["attendance", "summary", month],
  },
  workflow: {
    myTasks: () => ["workflow", "myTasks"],
    definitions: () => ["workflow", "definitions"],
    executions: (filters?: Record<string, unknown>) => ["workflow", "executions", filters ?? {}],
  },
  notifications: () => ["notifications"],
  ai: {
    commands: () => ["ai", "commands"],
  },
  reports: {
    dashboard: () => ["reports", "dashboard"],
  },
};
