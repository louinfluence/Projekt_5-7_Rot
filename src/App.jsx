import React, { useState } from "react";
import { addDays } from "date-fns";
import LernKalender from "./components/LernKalender";

export default function App() {
  // einfache Eingaben als feste Werte oder Formulare replace
  const startDatum = new Date();      // heute
  const tage = 3;                     // Anzahl Tage
  const stundenProTag = 2;            // Stunden pro Tag

  // Termine automatisch erstellen
  const events = Array.from({ length: tage }).map((_, i) => {
    const d = addDays(startDatum, i);
    return {
      title: `${stundenProTag} Std.`,
      date: d.toISOString().split("T")[0],
    };
  });

  return (
    <div>
      {/* Hier könnt ihr später noch eure Eingabe-Formulare bauen */}
      <LernKalender events={events} />
    </div>
  );
}
