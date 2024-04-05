import { useContext, useEffect, useMemo } from "react";
import { GenerativeContext, PerformerElement } from "../index.js";

export function useAfterChildren(
  element: PerformerElement | null,
  callback: () => void,
) {
  element && (element.props.afterChildren = callback);
}
