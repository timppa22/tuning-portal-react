'use client';

import TuningHistoryClient from "./TuningHistoryClient";

export default function TuningHistory() {
  return (
    <TuningHistoryClient initialData={{ tuningFiles: [] }} />
  );
}
