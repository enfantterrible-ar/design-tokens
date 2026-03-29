import { Config } from './types';

const config: Config = {
    core: {
        rootFontSize: 16,

        // primitive.core.base
        baseUnit: { value: 0.25, unit: "rem" },

        // extracted from your space scale
        baseSteps: [
            0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4,
            5, 6, 7, 8, 9, 10, 11, 12,
            14, 16, 20, 24, 28, 32,
            36, 40, 44, 48, 52, 56,
            60, 64, 72, 80, 96
        ]
    },

    tokens: {
        color: {
            $type: "color",
            $description: "Color palette",
            $config: {
                generator: "palette",
                params: { source: "tailwind", colorSpace: "srgb" }
            }
        },
        // -------------------------
        // SPACE (was primitive.space)
        // -------------------------
        space: {
			$description: "Space scale",
            $type: "dimension",
            $config: {
                generator: "steps",
                params: {
                    extend: {
                        "px-1":        { value: 1, unit: "px" }
                    }
                }
            }
        },

        // -------------------------
        // THICKNESS
        // -------------------------
        thickness: {
			$description: "Border thickness",
            $type: "dimension",
            $config: {
                generator: "steps",
                params: {
                    base: { value: 1, unit: "px" },
                    steps: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4],
                }
            }
        },

        // -------------------------
        // RADIUS
        // -------------------------
        radius: {
			$description: "Border radius",
            $type: "dimension",
            $config: {
                generator: "steps",
                params: {
                    steps: [
                        1, 1.5, 2, 2.5, 3, 3.5, 4,
                        5, 6, 7, 8, 9, 10, 11, 12,
                        14, 16
                    ],
                    extend: {
                        full: { value: 999, unit: "px" }
                    }
                }
            }
        },

        // -------------------------
        // DIFFUSION
        // -------------------------
        diffusion: {
			$description: "Difussion scale",
            $type: "dimension",
            $config: {
                generator: "steps",
                params: {
                    base: { value: 1, unit: "px" },
                    steps: [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8]
                }
            }
        },

        // -------------------------
        // TIME
        // -------------------------
        time: {
			$description: "Time scale",
            $type: "duration",
            $config: {
                generator: "range",
                params: {
                    min: 250,
                    max: 750,
                    step: 50,
					base: { value: 1, unit: "ms" }
                },
            }
        },

        // -------------------------
        // ANGLE
        // -------------------------
        angle: {
			$description: "Angle scale",
            $type: "number",
            $config: {
                generator: "range",
                params: { min: 0, max: 360, step: 15 }
            }
        },

        // -------------------------
        // WEIGHT
        // -------------------------
        weight: {
			$description: "Font weight scale",
            $type: "fontWeight",
            $config: {
                generator: "range",
                params: { min: 100, max: 900, step: 100 }
            }
        },

        // -------------------------
        // INDEX
        // -------------------------
        index: {
			$description: "Z-index scale",
            $type: "number",
            $config: {
                generator: "range",
                params: { min: 0, max: 50, step: 10 }
            }
        },

        // -------------------------
        // SCREENS
        // -------------------------
        screens: {
			$description: "Breakpoints",
            $type: "dimension",
            $config: {
                generator: "map",
                params: {
                    values: {
                        "1": { value: 40, unit: "rem" },
                        "2": { value: 48, unit: "rem" },
                        "3": { value: 64, unit: "rem" },
                        "4": { value: 80, unit: "rem" },
                        "5": { value: 96, unit: "rem" }
                    }
                }
            }
        }
    }
};

export { config };