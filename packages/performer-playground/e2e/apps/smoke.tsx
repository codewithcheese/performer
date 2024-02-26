/** @jsxImportSource @performer/core */

export function Throw() {
  throw new Error("This is an error message");
  return () => {};
}

export function App() {
  return () => (
    <>
      <system>Greet the user.</system>
      <assistant>Good day sir! How may I serve the?</assistant>
      <user>Tell the valet I will be leaving at **6pm**</user>
      <assistant>{`Yes sir, right away!
\`\`\`js
tellValet('User leaving at 6pm');
\`\`\`      
\`\`\`js
replyUser('Done');
\`\`\`  
      `}</assistant>
      <Throw />
    </>
  );
}
