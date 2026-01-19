import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Anchor,
  Badge,
  Card,
  Container,
  Group,
  Tabs,
  Text,
  TextInput,
  Title,
  Button,
  Grid,
  Table,
  Alert,
} from "@mantine/core";

function VariantPage() {
  const { variantId } = useParams();
  const navigate = useNavigate();

  const [topSearch, setTopSearch] = useState("");

  // For now we parse variantId if it is in a "chr-pos-ref-alt" style.
  // Example you can use: "4-71616842-A-G"
  const parsed = useMemo(() => {
    // Allow "chr4-716..." or "4-716..."
    const raw = variantId || "";
    const clean = raw.replace(/^chr/i, "");
    const parts = clean.split("-");

    if (parts.length >= 4) {
      return {
        chr: parts[0],
        pos: parts[1],
        ref: parts[2],
        alt: parts.slice(3).join("-"), // in case alt contains '-'
      };
    }

    return { chr: null, pos: null, ref: null, alt: null };
  }, [variantId]);

  const titleLine = useMemo(() => {
    if (parsed.chr && parsed.pos && parsed.ref && parsed.alt) {
      return `Variant: ${parsed.chr}:${parsed.pos} ${parsed.ref} / ${parsed.alt}`;
    }
    return `Variant: ${variantId}`;
  }, [parsed, variantId]);

  const handleTopSearch = () => {
    const q = topSearch.trim();
    if (!q) return;

    // very simple: if looks like ENS -> gene route, else try variant route
    if (/^ENS/i.test(q)) navigate(`/genes/${encodeURIComponent(q)}`);
    else navigate(`/variant/${encodeURIComponent(q)}`);
  };

  return (
    <Container size="xl" py="xl">
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" wrap="wrap" align="center">
          <Text fw={700}>Genome Variant Browser</Text>

          <Group wrap="wrap" gap="md">
            <TextInput
              placeholder="Gene, transcript, variant, or region"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTopSearch();
              }}
              w={360}
            />
            <Button onClick={handleTopSearch}>Search</Button>

            <Group gap="sm">
              <Anchor href="#about">About</Anchor>
              <Anchor href="#dbsnp">dbSNP</Anchor>
              <Anchor href="#api">API</Anchor>
              <Anchor href="#terms">Terms</Anchor>
            </Group>
          </Group>
        </Group>
      </Card>

      <Title order={2} mt="lg">
        {titleLine}
      </Title>

      <Alert color="yellow" title="Warning!" mt="sm">
        This is a UI replica. Add real coverage counts / QC stats later from your backend.
      </Alert>

      <Tabs defaultValue="summary" mt="lg">
        <Tabs.List>
          <Tabs.Tab value="summary">Summary</Tabs.Tab>
          <Tabs.Tab value="annotations">Annotations</Tabs.Tab>
          <Tabs.Tab value="frequencies">Frequencies</Tabs.Tab>
          <Tabs.Tab value="sequence-depth">Sequence Depth</Tabs.Tab>
          <Tabs.Tab value="genotype-quality">Genotype Quality</Tabs.Tab>
          <Tabs.Tab value="raw-sequences">Raw Sequences</Tabs.Tab>
          <Tabs.Tab value="site-quality">Site Quality Metrics</Tabs.Tab>
        </Tabs.List>

        {/* SUMMARY */}
        <Tabs.Panel value="summary" pt="md">
          <Grid gutter="md">
            {/* Left summary card */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Card withBorder radius="md" p="md">
                <Text fw={700} mb="sm">
                  Summary
                </Text>

                <Table>
                  <tbody>
                    <tr>
                      <td>
                        <Text c="dimmed">Filter Status</Text>
                      </td>
                      <td>
                        <Badge color="green" variant="light">
                          PASS
                        </Badge>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <Text c="dimmed">Existing Variation</Text>
                      </td>
                      <td>
                        <Anchor
                          href="#"
                          onClick={(e) => e.preventDefault()}
                        >
                          (rsID placeholder)
                        </Anchor>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <Text c="dimmed">Allele Count</Text>
                      </td>
                      <td>—</td>
                    </tr>

                    <tr>
                      <td>
                        <Text c="dimmed">Allele Frequency</Text>
                      </td>
                      <td>—</td>
                    </tr>

                    <tr>
                      <td>
                        <Text c="dimmed">Homozygous Alt Count</Text>
                      </td>
                      <td>—</td>
                    </tr>

                    <tr>
                      <td>
                        <Text c="dimmed">UCSC</Text>
                      </td>
                      <td>
                        <Anchor href="#" onClick={(e) => e.preventDefault()}>
                          {parsed.chr && parsed.pos ? `chr${parsed.chr}:${parsed.pos}` : "—"}
                        </Anchor>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <Text c="dimmed">ClinVar</Text>
                      </td>
                      <td>
                        <Anchor href="#" onClick={(e) => e.preventDefault()}>
                          not available
                        </Anchor>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card>
            </Grid.Col>

            {/* Middle annotations card */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder radius="md" p="md">
                <Text fw={700} mb="sm">
                  Annotations
                </Text>

                <Text size="sm" c="dimmed">
                  This variant falls on transcripts belonging to 1 gene:
                </Text>

                <Text mt="sm" fw={600}>
                  consequence (placeholder)
                </Text>

                <Text size="sm">
                  gene: <Anchor href="#" onClick={(e) => e.preventDefault()}>PCSK9</Anchor>
                </Text>

                <Text size="sm">
                  transcript:{" "}
                  <Anchor href="#" onClick={(e) => e.preventDefault()}>
                    ENST00000xxxxxx
                  </Anchor>
                </Text>

                <Text size="sm" mt="sm">
                  LoF: <Badge variant="light">High-confidence</Badge>
                </Text>

                <Group mt="md">
                  <Button variant="outline" size="xs">
                    Show all
                  </Button>
                </Group>

                <Text size="xs" c="dimmed" mt="md">
                  Note: This list may not include additional transcripts in the same gene.
                </Text>
              </Card>
            </Grid.Col>

            {/* Right frequency table */}
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder radius="md" p="md">
                <Text fw={700} mb="sm">
                  Frequency Table
                </Text>

                <Table withTableBorder>
                  <thead>
                    <tr>
                      <th>Population</th>
                      <th style={{ textAlign: "right" }}>Allele Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1000G African</td>
                      <td style={{ textAlign: "right" }}>Not available</td>
                    </tr>
                    <tr>
                      <td>1000G European</td>
                      <td style={{ textAlign: "right" }}>Not available</td>
                    </tr>
                    <tr>
                      <td>SGP Freeze</td>
                      <td style={{ textAlign: "right" }}>—</td>
                    </tr>
                  </tbody>
                </Table>
              </Card>
            </Grid.Col>

            {/* Bottom charts placeholders */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder radius="md" p="md">
                <Text fw={700} mb="sm">
                  Sequence Depth
                </Text>
                <Text size="sm" c="dimmed">
                  (Histogram placeholder)
                </Text>
                <div style={{ height: 240 }} />
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder radius="md" p="md">
                <Text fw={700} mb="sm">
                  Genotype Quality
                </Text>
                <Text size="sm" c="dimmed">
                  (Histogram placeholder)
                </Text>
                <div style={{ height: 240 }} />
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Other tabs (placeholders for now) */}
        <Tabs.Panel value="annotations" pt="md">
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Annotations</Title>
            <Text c="dimmed" mt="sm">
              Add your real annotation fields here (consequence, gene links, transcript list, LoF, etc.)
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="frequencies" pt="md">
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Frequencies</Title>
            <Text c="dimmed" mt="sm">
              Add allele frequency by population once you expose it from your backend.
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="sequence-depth" pt="md">
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Sequence Depth</Title>
            <Text c="dimmed" mt="sm">
              Later: histogram for all individuals vs carriers.
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="genotype-quality" pt="md">
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Genotype Quality</Title>
            <Text c="dimmed" mt="sm">
              Later: histogram for genotype quality.
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="raw-sequences" pt="md">
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Raw Sequences</Title>
            <Text c="dimmed" mt="sm">
              Optional: link or preview reads if you have them.
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="site-quality" pt="md">
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Site Quality Metrics</Title>
            <Text c="dimmed" mt="sm">
              Add site QC metrics later (coverage %, missingness, etc.)
            </Text>
          </Card>
        </Tabs.Panel>
      </Tabs>

      <Group mt="xl">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Group>
    </Container>
  );
}

export default VariantPage;
