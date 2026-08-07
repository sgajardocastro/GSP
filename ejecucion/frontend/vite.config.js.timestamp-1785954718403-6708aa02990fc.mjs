// vite.config.js
import { defineConfig, loadEnv } from "file:///D:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";

// package.json
var package_default = {
  name: "gsp-frontend",
  private: true,
  version: "1.0.22",
  type: "module",
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview"
  },
  dependencies: {
    "@vitejs/plugin-vue": "^5.0.0",
    axios: "^1.15.0",
    highcharts: "^12.6.0",
    leaflet: "^1.9.4",
    "lucide-vue-next": "^0.300.0",
    pinia: "^2.1.0",
    qrcode: "^1.5.4",
    "qrcode.vue": "^3.10.0",
    vue: "^3.4.0",
    "vue-router": "^4.2.0",
    xlsx: "^0.18.5"
  },
  devDependencies: {
    autoprefixer: "^10.4.0",
    postcss: "^8.4.0",
    tailwindcss: "^3.4.0",
    vite: "^5.0.0"
  }
};

// vite.config.js
var __vite_injected_original_dirname = "D:\\SGajardo\\Google Drive\\Antigravity\\Gr\xFAas San Pablo\\Propuesta Gesti\xF3n Operaci\xF3n Gr\xFAas\\ejecucion\\frontend";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawBaseUrl = env.VITE_APP_BASE_URL || "/";
  let base = "/";
  try {
    const parsed = new URL(rawBaseUrl);
    base = parsed.pathname || "/";
  } catch {
    base = rawBaseUrl.startsWith("/") ? rawBaseUrl : `/${rawBaseUrl}`;
  }
  if (!base.endsWith("/")) base = `${base}/`;
  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(package_default.version)
    },
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      port: 5173
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcU0dhamFyZG9cXFxcR29vZ2xlIERyaXZlXFxcXEFudGlncmF2aXR5XFxcXEdyXHUwMEZBYXMgU2FuIFBhYmxvXFxcXFByb3B1ZXN0YSBHZXN0aVx1MDBGM24gT3BlcmFjaVx1MDBGM24gR3JcdTAwRkFhc1xcXFxlamVjdWNpb25cXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFNHYWphcmRvXFxcXEdvb2dsZSBEcml2ZVxcXFxBbnRpZ3Jhdml0eVxcXFxHclx1MDBGQWFzIFNhbiBQYWJsb1xcXFxQcm9wdWVzdGEgR2VzdGlcdTAwRjNuIE9wZXJhY2lcdTAwRjNuIEdyXHUwMEZBYXNcXFxcZWplY3VjaW9uXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9TR2FqYXJkby9Hb29nbGUlMjBEcml2ZS9BbnRpZ3Jhdml0eS9HciVDMyVCQWFzJTIwU2FuJTIwUGFibG8vUHJvcHVlc3RhJTIwR2VzdGklQzMlQjNuJTIwT3BlcmFjaSVDMyVCM24lMjBHciVDMyVCQWFzL2VqZWN1Y2lvbi9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgcGtnIGZyb20gJy4vcGFja2FnZS5qc29uJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpXHJcbiAgY29uc3QgcmF3QmFzZVVybCA9IGVudi5WSVRFX0FQUF9CQVNFX1VSTCB8fCAnLydcclxuICBsZXQgYmFzZSA9ICcvJ1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTChyYXdCYXNlVXJsKVxyXG4gICAgYmFzZSA9IHBhcnNlZC5wYXRobmFtZSB8fCAnLydcclxuICB9IGNhdGNoIHtcclxuICAgIGJhc2UgPSByYXdCYXNlVXJsLnN0YXJ0c1dpdGgoJy8nKSA/IHJhd0Jhc2VVcmwgOiBgLyR7cmF3QmFzZVVybH1gXHJcbiAgfVxyXG5cclxuICBpZiAoIWJhc2UuZW5kc1dpdGgoJy8nKSkgYmFzZSA9IGAke2Jhc2V9L2BcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2UsXHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgX19BUFBfVkVSU0lPTl9fOiBKU09OLnN0cmluZ2lmeShwa2cudmVyc2lvbiksXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW3Z1ZSgpXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBwb3J0OiA1MTczXHJcbiAgICB9XHJcblxyXG4gIH1cclxufSlcclxuIiwgIntcbiAgXCJuYW1lXCI6IFwiZ3NwLWZyb250ZW5kXCIsXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxuICBcInZlcnNpb25cIjogXCIxLjAuMjJcIixcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJkZXZcIjogXCJ2aXRlXCIsXG4gICAgXCJidWlsZFwiOiBcInZpdGUgYnVpbGRcIixcbiAgICBcInByZXZpZXdcIjogXCJ2aXRlIHByZXZpZXdcIlxuICB9LFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAdml0ZWpzL3BsdWdpbi12dWVcIjogXCJeNS4wLjBcIixcbiAgICBcImF4aW9zXCI6IFwiXjEuMTUuMFwiLFxuICAgIFwiaGlnaGNoYXJ0c1wiOiBcIl4xMi42LjBcIixcbiAgICBcImxlYWZsZXRcIjogXCJeMS45LjRcIixcbiAgICBcImx1Y2lkZS12dWUtbmV4dFwiOiBcIl4wLjMwMC4wXCIsXG4gICAgXCJwaW5pYVwiOiBcIl4yLjEuMFwiLFxuICAgIFwicXJjb2RlXCI6IFwiXjEuNS40XCIsXG4gICAgXCJxcmNvZGUudnVlXCI6IFwiXjMuMTAuMFwiLFxuICAgIFwidnVlXCI6IFwiXjMuNC4wXCIsXG4gICAgXCJ2dWUtcm91dGVyXCI6IFwiXjQuMi4wXCIsXG4gICAgXCJ4bHN4XCI6IFwiXjAuMTguNVwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcImF1dG9wcmVmaXhlclwiOiBcIl4xMC40LjBcIixcbiAgICBcInBvc3Rjc3NcIjogXCJeOC40LjBcIixcbiAgICBcInRhaWx3aW5kY3NzXCI6IFwiXjMuNC4wXCIsXG4gICAgXCJ2aXRlXCI6IFwiXjUuMC4wXCJcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2aEIsU0FBUyxjQUFjLGVBQWU7QUFDbmtCLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7OztBQ0ZqQjtBQUFBLEVBQ0UsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsU0FBVztBQUFBLEVBQ1gsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLElBQ1QsS0FBTztBQUFBLElBQ1AsT0FBUztBQUFBLElBQ1QsU0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLGNBQWdCO0FBQUEsSUFDZCxzQkFBc0I7QUFBQSxJQUN0QixPQUFTO0FBQUEsSUFDVCxZQUFjO0FBQUEsSUFDZCxTQUFXO0FBQUEsSUFDWCxtQkFBbUI7QUFBQSxJQUNuQixPQUFTO0FBQUEsSUFDVCxRQUFVO0FBQUEsSUFDVixjQUFjO0FBQUEsSUFDZCxLQUFPO0FBQUEsSUFDUCxjQUFjO0FBQUEsSUFDZCxNQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsaUJBQW1CO0FBQUEsSUFDakIsY0FBZ0I7QUFBQSxJQUNoQixTQUFXO0FBQUEsSUFDWCxhQUFlO0FBQUEsSUFDZixNQUFRO0FBQUEsRUFDVjtBQUNGOzs7QUQ3QkEsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBQzNDLFFBQU0sYUFBYSxJQUFJLHFCQUFxQjtBQUM1QyxNQUFJLE9BQU87QUFFWCxNQUFJO0FBQ0YsVUFBTSxTQUFTLElBQUksSUFBSSxVQUFVO0FBQ2pDLFdBQU8sT0FBTyxZQUFZO0FBQUEsRUFDNUIsUUFBUTtBQUNOLFdBQU8sV0FBVyxXQUFXLEdBQUcsSUFBSSxhQUFhLElBQUksVUFBVTtBQUFBLEVBQ2pFO0FBRUEsTUFBSSxDQUFDLEtBQUssU0FBUyxHQUFHLEVBQUcsUUFBTyxHQUFHLElBQUk7QUFFdkMsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLGlCQUFpQixLQUFLLFVBQVUsZ0JBQUksT0FBTztBQUFBLElBQzdDO0FBQUEsSUFDQSxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQUEsSUFDZixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLEVBRUY7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
