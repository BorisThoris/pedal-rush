import React from "react";
import { render, screen } from "@testing-library/react";
import App, { createTraffic, hasCollision, nextLane } from "./App";

it("renders the upgraded game surface", () => {
  render(<App />);

  expect(screen.getByLabelText("Pedal Rush game")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Gas" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Brake" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Move left" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Move right" })).toBeInTheDocument();
});

it("clamps lane changes to the three road lanes", () => {
  expect(nextLane(0, -1)).toBe(0);
  expect(nextLane(1, -1)).toBe(0);
  expect(nextLane(1, 1)).toBe(2);
  expect(nextLane(2, 1)).toBe(2);
});

it("detects same-lane traffic collisions only in the player zone", () => {
  expect(hasCollision({ lane: 1, y: 70 }, 1, false)).toBe(true);
  expect(hasCollision({ lane: 0, y: 70 }, 1, false)).toBe(false);
  expect(hasCollision({ lane: 1, y: 40 }, 1, false)).toBe(false);
  expect(hasCollision({ lane: 1, y: 70 }, 1, true)).toBe(false);
});

it("creates deterministic traffic inside valid lanes", () => {
  const traffic = [createTraffic(0), createTraffic(1), createTraffic(2), createTraffic(3)];

  expect(traffic.every(car => car.lane >= 0 && car.lane <= 2)).toBe(true);
  expect(traffic.every(car => car.passed === false)).toBe(true);
});
