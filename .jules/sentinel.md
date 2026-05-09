## 2024-05-09 - [Missing RBAC configuration in Spring Security]
**Vulnerability:** The application was missing Role-Based Access Control (RBAC) in the `SecurityConfig`, relying only on `.authenticated()`. Endpoints intended only for `ROLE_ASESOR` or `ROLE_GRANJERO` were technically accessible by any authenticated user.
**Learning:** In Spring Boot applications using custom roles (e.g., `ROLE_ASESOR`), it's crucial to explicitly map paths to roles using `.hasRole("...")` in the `SecurityFilterChain` to enforce defense-in-depth authorization.
**Prevention:** Always verify that `SecurityFilterChain` uses `requestMatchers` with `.hasRole()` or `.hasAuthority()` when application logic dictates role separation.
