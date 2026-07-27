// vite.config.js
import { defineConfig, loadEnv } from "file:///D:/SGajardo/Google%20Drive/Antigravity/Transmac/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/SGajardo/Google%20Drive/Antigravity/Transmac/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";

// package.json
var package_default = {
  name: "transmac-frontend",
  private: true,
  version: "1.1.13",
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
    "lucide-vue-next": "^0.300.0",
    pinia: "^2.1.0",
    qrcode: "^1.5.4",
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
var __vite_injected_original_dirname = "D:\\SGajardo\\Google Drive\\Antigravity\\Transmac\\frontend";
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
      port: 5173,
      strictPort: true
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcU0dhamFyZG9cXFxcR29vZ2xlIERyaXZlXFxcXEFudGlncmF2aXR5XFxcXFRyYW5zbWFjXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxTR2FqYXJkb1xcXFxHb29nbGUgRHJpdmVcXFxcQW50aWdyYXZpdHlcXFxcVHJhbnNtYWNcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1NHYWphcmRvL0dvb2dsZSUyMERyaXZlL0FudGlncmF2aXR5L1RyYW5zbWFjL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcbmltcG9ydCBwa2cgZnJvbSAnLi9wYWNrYWdlLmpzb24nXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJylcclxuICBjb25zdCByYXdCYXNlVXJsID0gZW52LlZJVEVfQVBQX0JBU0VfVVJMIHx8ICcvJ1xyXG4gIGxldCBiYXNlID0gJy8nXHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHJhd0Jhc2VVcmwpXHJcbiAgICBiYXNlID0gcGFyc2VkLnBhdGhuYW1lIHx8ICcvJ1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgYmFzZSA9IHJhd0Jhc2VVcmwuc3RhcnRzV2l0aCgnLycpID8gcmF3QmFzZVVybCA6IGAvJHtyYXdCYXNlVXJsfWBcclxuICB9XHJcblxyXG4gIGlmICghYmFzZS5lbmRzV2l0aCgnLycpKSBiYXNlID0gYCR7YmFzZX0vYFxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgYmFzZSxcclxuICAgIGRlZmluZToge1xyXG4gICAgICBfX0FQUF9WRVJTSU9OX186IEpTT04uc3RyaW5naWZ5KHBrZy52ZXJzaW9uKSxcclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbdnVlKCldLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDUxNzMsXHJcbiAgICAgIHN0cmljdFBvcnQ6IHRydWVcclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiIsICJ7XG4gIFwibmFtZVwiOiBcInRyYW5zbWFjLWZyb250ZW5kXCIsXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxuICBcInZlcnNpb25cIjogXCIxLjEuMTNcIixcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJkZXZcIjogXCJ2aXRlXCIsXG4gICAgXCJidWlsZFwiOiBcInZpdGUgYnVpbGRcIixcbiAgICBcInByZXZpZXdcIjogXCJ2aXRlIHByZXZpZXdcIlxuICB9LFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAdml0ZWpzL3BsdWdpbi12dWVcIjogXCJeNS4wLjBcIixcbiAgICBcImF4aW9zXCI6IFwiXjEuMTUuMFwiLFxuICAgIFwiaGlnaGNoYXJ0c1wiOiBcIl4xMi42LjBcIixcbiAgICBcImx1Y2lkZS12dWUtbmV4dFwiOiBcIl4wLjMwMC4wXCIsXG4gICAgXCJwaW5pYVwiOiBcIl4yLjEuMFwiLFxuICAgIFwicXJjb2RlXCI6IFwiXjEuNS40XCIsXG4gICAgXCJ2dWVcIjogXCJeMy40LjBcIixcbiAgICBcInZ1ZS1yb3V0ZXJcIjogXCJeNC4yLjBcIixcbiAgICBcInhsc3hcIjogXCJeMC4xOC41XCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiYXV0b3ByZWZpeGVyXCI6IFwiXjEwLjQuMFwiLFxuICAgIFwicG9zdGNzc1wiOiBcIl44LjQuMFwiLFxuICAgIFwidGFpbHdpbmRjc3NcIjogXCJeMy40LjBcIixcbiAgICBcInZpdGVcIjogXCJeNS4wLjBcIlxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtXLFNBQVMsY0FBYyxlQUFlO0FBQ3hZLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7OztBQ0ZqQjtBQUFBLEVBQ0UsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsU0FBVztBQUFBLEVBQ1gsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLElBQ1QsS0FBTztBQUFBLElBQ1AsT0FBUztBQUFBLElBQ1QsU0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLGNBQWdCO0FBQUEsSUFDZCxzQkFBc0I7QUFBQSxJQUN0QixPQUFTO0FBQUEsSUFDVCxZQUFjO0FBQUEsSUFDZCxtQkFBbUI7QUFBQSxJQUNuQixPQUFTO0FBQUEsSUFDVCxRQUFVO0FBQUEsSUFDVixLQUFPO0FBQUEsSUFDUCxjQUFjO0FBQUEsSUFDZCxNQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsaUJBQW1CO0FBQUEsSUFDakIsY0FBZ0I7QUFBQSxJQUNoQixTQUFXO0FBQUEsSUFDWCxhQUFlO0FBQUEsSUFDZixNQUFRO0FBQUEsRUFDVjtBQUNGOzs7QUQzQkEsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBQzNDLFFBQU0sYUFBYSxJQUFJLHFCQUFxQjtBQUM1QyxNQUFJLE9BQU87QUFFWCxNQUFJO0FBQ0YsVUFBTSxTQUFTLElBQUksSUFBSSxVQUFVO0FBQ2pDLFdBQU8sT0FBTyxZQUFZO0FBQUEsRUFDNUIsUUFBUTtBQUNOLFdBQU8sV0FBVyxXQUFXLEdBQUcsSUFBSSxhQUFhLElBQUksVUFBVTtBQUFBLEVBQ2pFO0FBRUEsTUFBSSxDQUFDLEtBQUssU0FBUyxHQUFHLEVBQUcsUUFBTyxHQUFHLElBQUk7QUFFdkMsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLGlCQUFpQixLQUFLLFVBQVUsZ0JBQUksT0FBTztBQUFBLElBQzdDO0FBQUEsSUFDQSxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQUEsSUFDZixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
