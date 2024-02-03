import { Assistant, type UseResourceHook } from "@performer/core";

async function fetchRepos(user: string) {
  const response = await fetch(
    `https://api.github.com/users/${user}/repos?sort=updated`,
  );
  return response.json();
}

async function Repos(
  { user }: { user: string },
  { useResource }: { useResource: UseResourceHook },
) {
  const repos = await useResource(() => fetchRepos(user));

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

export function RecentWork({ user }: { user: string }) {
  return () => (
    <>
      <Repos user={user} />
      <user>What has {user} been working on recently?</user>
      <Assistant />
    </>
  );
}
