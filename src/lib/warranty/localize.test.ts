import { describe, expect, it } from "vitest";
import { normalizeWarrantyOptions } from "./localize";

describe("normalizeWarrantyOptions", () => {
  const warranty = {
    default_option: {
      warranty_option_id: "default",
      name: "NL Inbegrepen testgarantie",
      duration_years: 1,
      price: 0,
      description: "NL testomschrijving voor de inbegrepen garantie.",
      translations: [
        {
          en: {
            default_warranty_name: "EN Test Included Warranty",
            default_warranty_description: "EN Test Included Warranty description.",
          },
        },
        {
          nl: {
            default_warranty_name: "NL Inbegrepen testgarantie",
            default_warranty_description: "NL testomschrijving voor de inbegrepen garantie.",
          },
        },
      ],
    },
    types: [
      {
        id: 1,
        name: "NL Retourservice testgarantie",
        description: "NL testomschrijving voor Retourservice.",
        badge_text: "NL Aanbevolen",
        badge_color: "#0f766e",
        translations: [
          {
            en: {
              name: "EN RTBS Test Warranty Type",
              description: "EN RTBS Test Warranty Type description.",
              badge_text: "EN Test Badge",
            },
          },
          {
            nl: {
              name: "NL Retourservice testgarantie",
              description: "NL testomschrijving voor Retourservice.",
              badge_text: "NL Aanbevolen",
            },
          },
        ],
        options: [
          {
            id: 6,
            name: "NL 4 jaar testgarantie",
            duration_years: 4,
            price: 40,
            description: "NL testomschrijving voor 4 jaar garantie.",
            translations: [
              {
                en: {
                  name: "EN 4 Year Test Warranty Option",
                  description: "EN 4 Year Test Warranty Option description.",
                },
              },
              {
                nl: {
                  name: "NL 4 jaar testgarantie",
                  description: "NL testomschrijving voor 4 jaar garantie.",
                },
              },
            ],
          },
        ],
      },
    ],
  };

  it("uses warranty translations for the selected frontend locale", () => {
    const english = normalizeWarrantyOptions(warranty, "en");
    const dutch = normalizeWarrantyOptions(warranty, "nl");

    expect(english.defaultOption).toMatchObject({
      name: "EN Test Included Warranty",
      description: "EN Test Included Warranty description.",
    });
    expect(english.types[0]).toMatchObject({
      name: "EN RTBS Test Warranty Type",
      description: "EN RTBS Test Warranty Type description.",
      badgeText: "EN Test Badge",
    });
    expect(english.types[0].options[0]).toMatchObject({
      name: "EN 4 Year Test Warranty Option",
      typeName: "EN RTBS Test Warranty Type",
      description: "EN 4 Year Test Warranty Option description.",
    });

    expect(dutch.defaultOption).toMatchObject({
      name: "NL Inbegrepen testgarantie",
      description: "NL testomschrijving voor de inbegrepen garantie.",
    });
    expect(dutch.types[0]).toMatchObject({
      name: "NL Retourservice testgarantie",
      description: "NL testomschrijving voor Retourservice.",
      badgeText: "NL Aanbevolen",
    });
    expect(dutch.types[0].options[0]).toMatchObject({
      name: "NL 4 jaar testgarantie",
      typeName: "NL Retourservice testgarantie",
      description: "NL testomschrijving voor 4 jaar garantie.",
    });
  });
});
