export function findId(id: string) {
  return (obj: { id: string }) => obj.id === id;
}
