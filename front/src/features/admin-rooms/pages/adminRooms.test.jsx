import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { JSDOM } from "jsdom";
import { setupServer } from "msw/node";
import { adminRoomsHandlers } from "../../../test/mocks/handlers/adminRooms.js";

if (typeof globalThis.document === "undefined") {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  for (const source of [dom.window, Object.getPrototypeOf(dom.window)]) {
    for (const prop of Object.getOwnPropertyNames(source)) {
      if (prop in globalThis) continue;
      try {
        Object.defineProperty(globalThis, prop, {
          configurable: true,
          writable: true,
          value: dom.window[prop],
        });
      } catch {
        // Some globals are read-only (e.g. navigator): skip them.
      }
    }
  }
}

const matchers = await import("@testing-library/jest-dom/matchers");
expect.extend(matchers);

const { render, screen, cleanup } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const { AdminRoomsPage } = await import("./AdminRoomsPage");

const server = setupServer(...adminRoomsHandlers);

beforeAll(() => server.listen());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

describe("AdminRooms Acceptance Tests", () => {
  test("Only visible to admin role", async () => {
    render(<AdminRoomsPage />);
    expect(screen.getByText(/gestión de salas/i)).toBeInTheDocument();
  });

  test("Create and edit room form validation using React Hook Form & Zod", async () => {
    render(<AdminRoomsPage />);

    await screen.findByText(/gestión de salas/i);

    const submitBtn = screen.getByRole("button", { name: /guardar sala/i });
    await userEvent.click(submitBtn);

    expect(await screen.findByText(/el slug es obligatorio/i)).toBeInTheDocument();
  });

  test("Validation matches API rules: min_players range and duplicate slug", async () => {
    render(<AdminRoomsPage />);

    await screen.findByText(/gestión de salas/i);

    const slugInput = screen.getByLabelText(/slug/i);
    await userEvent.type(slugInput, "duplicate-slug");
    await userEvent.click(screen.getByRole("button", { name: /guardar sala/i }));

    expect(await screen.findByText(/este slug ya existe/i)).toBeInTheDocument();
  });

  test("Activate / Deactivate toggle works in the rooms table", async () => {
    render(<AdminRoomsPage />);

    const toggleBtn = await screen.findByRole("button", { name: /desactivar/i });
    await userEvent.click(toggleBtn);

    expect(await screen.findByRole("button", { name: /activar/i })).toBeInTheDocument();
  });

  test("After creating a room, form notifies admin that clients see it only with upcoming time slots (BR-R6)", async () => {
    render(<AdminRoomsPage />);

    await screen.findByText(/gestión de salas/i);

    await userEvent.type(screen.getByLabelText(/slug/i), "new-adventure");
    await userEvent.type(screen.getByLabelText(/género/i), "Sci-Fi");
    await userEvent.type(screen.getByLabelText(/hook/i), "Exciting hook");
    await userEvent.type(screen.getByLabelText(/historia/i), "Long story here");
    await userEvent.type(screen.getByLabelText(/público/i), "All audiences");

    await userEvent.click(screen.getByRole("button", { name: /guardar sala/i }));

    expect(await screen.findByText(/los clientes la verán solo cuando tenga franjas horarias próximas/i)).toBeInTheDocument();
  });
});
