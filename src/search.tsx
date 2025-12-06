import { ActionPanel, Action, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";

const SCHEMA_URL = "https://app.faraday.ai/api.json";
const PAGE_URL = "https://faraday.ai/docs/reference/";

type OpenAPISchema = {
  paths: {
    [path: string]: {
      [method: string]: {
        summary: string;
        operationId: string;
        tags: string[];
      };
    };
  };
};

type OperationItem = {
  id: string;
  icon: Icon;
  title: string;
  subtitle: string;
  accessory: string;
  url: string;
};

function transformSchemaToItems(data: OpenAPISchema): { [tag: string]: OperationItem[] } {
  const groups: { [tag: string]: OperationItem[] } = {};

  if (data.paths) {
    Object.entries(data.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, op]) => {
        const tag = op.tags && op.tags.length > 0 ? op.tags[0] : "Other";
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push({
          id: `${method.toUpperCase()} ${path}`,
          icon: Icon.Link,
          title: op.summary || `${method.toUpperCase()} ${path}`,
          subtitle: path,
          accessory: method.toUpperCase(),
          url: PAGE_URL + op.operationId.toLowerCase(),
        });
      });
    });
  }
  return groups;
}

export default function Command() {
  const [items, setItems] = useState<{ [tag: string]: OperationItem[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const res = await fetch(SCHEMA_URL);
        const data = (await res.json()) as OpenAPISchema;
        setItems(transformSchemaToItems(data));
      } catch (e) {
        console.error("Error fetching schema:", e);
        setItems({});
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search operations...">
      {Object.entries(items).map(([tag, ops]) => (
        <List.Section key={tag} title={tag}>
          {ops.map((item) => (
            <List.Item
              key={item.id}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              accessories={[{ icon: Icon.Text, text: item.accessory }]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser url={item.url} />
                  <Action.CopyToClipboard content={item.url} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
