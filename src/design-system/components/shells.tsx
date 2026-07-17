import { type ReactNode } from "react";
import { BrandMark } from "@/design-system/components/primitives";
import { Container, Stack, Cluster } from "@/design-system/components/layout";
import { Heading, Text } from "@/design-system/components/typography";
import { ThemeToggle } from "@/design-system/components/theme";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background py-[var(--dh-space-10)]">
      <div className="absolute top-[var(--dh-space-4)] right-[var(--dh-space-4)]">
        <ThemeToggle />
      </div>
      <Container size="auth">
        <Stack gap={6}>
          <div className="text-center">
            <Cluster className="justify-center">
              <BrandMark withWordmark size="md" />
            </Cluster>
            <Heading
              level={1}
              className="mt-[var(--dh-space-6)] !text-[length:var(--dh-text-2xl)]"
            >
              {title}
            </Heading>
            {description ? (
              <Text size="sm" tone="muted" className="mt-[var(--dh-space-1)]">
                {description}
              </Text>
            ) : null}
          </div>
          {children}
          {footer}
        </Stack>
      </Container>
    </div>
  );
}

export function PageSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section>
      {title ? (
        <Heading level={3} className="mb-[var(--dh-space-3)]">
          {title}
        </Heading>
      ) : null}
      {children}
    </section>
  );
}
