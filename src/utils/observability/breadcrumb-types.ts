/**
 * User interaction event types for debugging timeline reconstruction.
 */
export type BreadcrumbType = 'click' | 'navigation' | 'form_submit' | 'network';

/**
 * Click interaction breadcrumb.
 */
export interface ClickBreadcrumb {
  /** Event type discriminator */
  type: 'click';

  /** Click event data (PII-scrubbed) */
  data: {
    /** CSS selector of clicked element (e.g., "button.submit") */
    selector: string;
  };

  /** Client timestamp (milliseconds since epoch) */
  timestamp: number;

  /** Optional correlation ID for trace linking */
  correlationId?: string;
}

/**
 * Page navigation breadcrumb.
 */
export interface NavigationBreadcrumb {
  type: 'navigation';
  data: {
    /** URL pathname without query parameters (e.g., "/drafts") */
    url: string;
  };
  timestamp: number;
  correlationId?: string;
}

/**
 * Form submission breadcrumb.
 */
export interface FormSubmitBreadcrumb {
  type: 'form_submit';
  data: {
    /** Form element ID (no input values captured) */
    formId: string;
  };
  timestamp: number;
  correlationId?: string;
}

/**
 * Network request breadcrumb.
 */
export interface NetworkBreadcrumb {
  type: 'network';
  data: {
    /** Endpoint path (e.g., "/api/v1/drafts") */
    path: string;

    /** HTTP status code */
    statusCode: number;
  };
  timestamp: number;
  correlationId?: string;
}

/**
 * Discriminated union of all breadcrumb event types.
 */
export type BreadcrumbEvent =
  | ClickBreadcrumb
  | NavigationBreadcrumb
  | FormSubmitBreadcrumb
  | NetworkBreadcrumb;

/**
 * Configuration for BreadcrumbManager initialization.
 */
export interface BreadcrumbConfig {
  /** Maximum number of breadcrumbs to retain (default: 20) */
  maxItems?: number;

  /** Maximum total size in KB (default: 5) */
  maxSizeKb?: number;

  /** Storage key for sessionStorage/AsyncStorage (default: 'mtsynergy_breadcrumbs') */
  storageKey?: string;
}

/**
 * Platform-agnostic persistence interface.
 */
export interface IPersistenceProvider {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
