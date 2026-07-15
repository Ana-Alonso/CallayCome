import type { RecipeSuggestion } from "../../types";
import { Check, X } from "lucide-react";

import { Dialogo } from "../common/Dialogo";
import { Box } from "../common/Box";
import { TextMuted } from "../common/TextMuted";
import { PantryInputGrid } from "../common/PantryInputGrid";
import { PantryItemContainer } from "../common/PantryItemContainer";
import { FlexRow } from "../common/FlexRow";
import { PantryItemName } from "../common/PantryItemName";
import { PantryItemQty } from "../common/PantryItemQty";
import { Boton } from "../common/Boton";

interface SuggestionsDialogProps {
  abierto: boolean;
  al_cerrar: () => void;
  suggestions: RecipeSuggestion[];
  current_role?: "cocinitas" | "miembro" | null;
  on_vote: (suggestion_id: number, vote: "like" | "dislike") => void;
  on_approve: (suggestion_id: number) => void;
  on_reject: (suggestion_id: number) => void;
}

export const SuggestionsDialog = ({
  abierto,
  al_cerrar,
  suggestions,
  current_role,
  on_vote,
  on_approve,
  on_reject,
}: SuggestionsDialogProps) => {
  return (
    <Dialogo
      abierto={abierto}
      on_close={al_cerrar}
      titulo="Propuestas de Cambio"
    >
      <Box style={{ minWidth: "320px", maxWidth: "500px" }}>
        <TextMuted style={{ fontSize: 13, marginBottom: "16px" }}>
          {current_role === "cocinitas"
            ? 'Como "El Cocinitas", revisa los votos y decide:'
            : "Vota las sugerencias propuestas por la familia:"}
        </TextMuted>

        <PantryInputGrid style={{ gridTemplateColumns: "1fr", gap: 10 }}>
          {suggestions.map((suggestion) => (
            <PantryItemContainer
              key={suggestion.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
              }}
            >
              <FlexRow style={{ justifyContent: "space-between" }}>
                <PantryItemName>
                  Día {suggestion.day} ({suggestion.meal_type.toUpperCase()})
                </PantryItemName>
                <PantryItemQty style={{ textAlign: "right" }}>
                  {suggestion.recipe_name}
                </PantryItemQty>
              </FlexRow>

              <TextMuted style={{ fontSize: 12, marginTop: 4 }}>
                Sugerido por: {suggestion.user_display_name}
              </TextMuted>

              <FlexRow
                style={{
                  marginTop: 12,
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {current_role === "miembro" && (
                  <FlexRow style={{ gap: 8 }}>
                    <Boton
                      texto={`${suggestion.likes_count || 0}`}
                      color={
                        suggestion.my_vote === "like" ? "primary" : "inherit"
                      }
                      variante={
                        suggestion.my_vote === "like" ? "contained" : "outlined"
                      }
                      clase_css="btn-sm"
                      icono={<span style={{ fontSize: "14px" }}>👍</span>}
                      on_click={() => on_vote(suggestion.id, "like")}
                    />
                    <Boton
                      texto={`${suggestion.dislikes_count || 0}`}
                      color={
                        suggestion.my_vote === "dislike" ? "error" : "inherit"
                      }
                      variante={
                        suggestion.my_vote === "dislike"
                          ? "contained"
                          : "outlined"
                      }
                      clase_css="btn-sm"
                      icono={<span style={{ fontSize: "14px" }}>👎</span>}
                      on_click={() => on_vote(suggestion.id, "dislike")}
                    />
                  </FlexRow>
                )}

                {current_role === "cocinitas" && (
                  <>
                    <FlexRow style={{ gap: 12, alignItems: "center" }}>
                      <TextMuted style={{ fontSize: 13, fontWeight: 500 }}>
                        👍 {suggestion.likes_count || 0}
                      </TextMuted>
                      <TextMuted style={{ fontSize: 13, fontWeight: 500 }}>
                        👎 {suggestion.dislikes_count || 0}
                      </TextMuted>
                    </FlexRow>

                    <FlexRow style={{ gap: 8 }}>
                      <Boton
                        texto="Aprobar"
                        color="success"
                        clase_css="btn-sm"
                        icono={<Check size={14} />}
                        on_click={() => on_approve(suggestion.id)}
                      />
                      <Boton
                        texto="Rechazar"
                        color="error"
                        clase_css="btn-sm"
                        icono={<X size={14} />}
                        on_click={() => on_reject(suggestion.id)}
                      />
                    </FlexRow>
                  </>
                )}
              </FlexRow>
            </PantryItemContainer>
          ))}
        </PantryInputGrid>

        {suggestions.length === 0 && (
          <TextMuted style={{ textAlign: "center", margin: "20px 0" }}>
            No hay sugerencias pendientes en este momento.
          </TextMuted>
        )}
      </Box>
    </Dialogo>
  );
};
