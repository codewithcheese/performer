/**
 * Based on https://js.langchain.com/docs/modules/chains/popular/sqlite
 */
import { Assistant, Tool, UseHook, User } from "@performer/core";
import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { z } from "zod";
import { ChatOpenAI } from "langchain/chat_models/openai";
import * as path from "path";
import sqlite3 from "sqlite3";

sqlite3.verbose();

class SQLSelectTool implements Tool {
  id = "sql_select_tool";
  name = "sql_select_query";
  description =
    "Write a SQLite 3 to select data that answers the users question.";
  params = z.object({
    query: z.string(),
  });

  constructor(private db: SqlDatabase) {}

  async call({ query }: z.infer<typeof this.params>) {
    const content = await this.db.run(query);
    return {
      id: this.id,
      // todo test OpenAI appears to ignore `tool` messages
      role: "tool" as const,
      content: `${content}`,
    };
  }
}

export async function App({}, use: UseHook) {
  const datasource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "Chinook.db"),
  });
  const model = new ChatOpenAI({ modelName: "gpt-4-1106-preview" });

  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  });

  const schema = await use(() => db.getTableInfo());
  const tools = [new SQLSelectTool(db)];

  return () => (
    <>
      <system>
        Based on the table schema below, write a SQL query that would answer the
        user's question:
        {schema}
      </system>
      <User />
      <Assistant
        model={model}
        toolChoice={tools.length ? tools[0] : "auto"}
        tools={tools}
      />
      <system>
        Use the SQL response to answer the users question using natural language
      </system>
      <Assistant />
    </>
  );
}
