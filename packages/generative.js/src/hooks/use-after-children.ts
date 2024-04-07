import { useContext, useEffect, useMemo } from "react";
import { GenerativeContext, GenerativeElement } from "../index.js";

export function useAfterChildren(
  element: GenerativeElement | null,
  callback: () => void,
) {
  element && (element.props.afterChildren = callback);
}
