import { Assistant, useResource } from "@performer/core";

export const name = "Repo question";

async function fetchRepos(controller: AbortController, user: string) {
  const response = await fetch(
    `https://api.github.com/users/${user}/repos?sort=updated`,
    { signal: controller.signal },
  );
  return response.json();
}

function Repos({ user }: { user: string }) {
  const repos = useResource(fetchRepos, user);

  return () => (
    <system>
      Answer questions about the {user}'s GitHub respositories
      {user}'s GitHub Repositories:
      {repos.map(
        (repo: any) => `  
        ${repo.full_name}  
        ${repo.description}  
        \n`,
      )}
    </system>
  );
}

export function App({ user = "openai" }: { user: string }) {
  return () => (
    <>
      <Repos user={user} />
      <user>What has {user} been working on recently?</user>
      <Assistant />
    </>
  );
}
