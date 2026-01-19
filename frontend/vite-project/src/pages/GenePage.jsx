import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Pagination,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

function GenePage() {
  const { geneId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [topSearch, setTopSearch] = useState("");

  const [gene, setGene] = useState(null);
  const [variants, setVariants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // UI state
  const [variantTab, setVariantTab] = useState("all"); // all | snp | indel
  const [quality, setQuality] = useState("PASS"); // PASS | ALL
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState("100");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchGeneData = async () => {
      try {
        setError("");
        setLoading(true);

        const resGene = await fetch(`${API_BASE_URL}/genes/${geneId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resGene.ok) throw new Error("Greška pri dohvaćanju gena");
        const geneData = await resGene.json();
        setGene(geneData);

        const resVariants = await fetch(`${API_BASE_URL}/genes/${geneId}/variants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resVariants.ok) throw new Error("Greška pri dohvaćanju varijanti");
        const variantData = await resVariants.json();
        setVariants(variantData.items || []);
      } catch (err) {
        console.error(err);
        setError("Došlo je do pogreške prilikom učitavanja gena.");
      } finally {
        setLoading(false);
      }
    };

    fetchGeneData();
  }, [geneId, token]);

  const regionLabel = useMemo(() => {
    if (!gene) return "";
    return `chr${gene.chromosome_name}:${gene.start_position}-${gene.end_position}`;
  }, [gene]);

  // --- SMART TOP SEARCH (gene name or gene id)
  const handleTopSearch = async () => {
    const q = topSearch.trim();
    if (!q) return;

    // If user already pasted Ensembl-style gene id, go directly
    if (/^ENS/i.test(q)) {
      navigate(`/genes/${encodeURIComponent(q)}`);
      return;
    }

    // Otherwise try resolve by calling your API
    try {
      const res = await fetch(`${API_BASE_URL}/genes/${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // fallback: try route directly anyway
        navigate(`/genes/${encodeURIComponent(q)}`);
        return;
      }
      const data = await res.json();

      // Your backend sometimes returns a single object; sometimes array (depending how you implemented)
      const geneIdFound = data?.gene_id || data?.id || (Array.isArray(data) && data[0]?.gene_id);

      if (geneIdFound) navigate(`/genes/${encodeURIComponent(geneIdFound)}`);
      else navigate(`/genes/${encodeURIComponent(q)}`);
    } catch (e) {
      navigate(`/genes/${encodeURIComponent(q)}`);
    }
  };

  // --- client-side filtering
  const filteredVariants = useMemo(() => {
    const q = query.trim().toLowerCase();
    const onlyPass = quality === "PASS";

    return (variants || []).filter((v) => {
      if (onlyPass && v.filter_status && v.filter_status !== "PASS") return false;

      if (variantTab === "snp" && (v.variant_type || "").toLowerCase() !== "snp") return false;
      if (variantTab === "indel" && (v.variant_type || "").toLowerCase() !== "indel") return false;

      if (!q) return true;

      const haystack = [
        v.chromosome_name,
        v.position,
        v.reference_allele,
        v.alternate_allele,
        v.variant_type,
        v.filter_status,
        v.rs_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [variants, query, quality, variantTab]);

  const pageSizeNum = useMemo(() => {
    const n = parseInt(pageSize, 10);
    return Number.isFinite(n) && n > 0 ? n : 100;
  }, [pageSize]);

  const totalPages = useMemo(() => {
    return filteredVariants.length === 0 ? 1 : Math.ceil(filteredVariants.length / pageSizeNum);
  }, [filteredVariants.length, pageSizeNum]);

  useEffect(() => setPage(1), [variantTab, quality, query, pageSize]);

  const pagedVariants = useMemo(() => {
    const start = (page - 1) * pageSizeNum;
    return filteredVariants.slice(start, start + pageSizeNum);
  }, [filteredVariants, page, pageSizeNum]);

  // --- summary counts
  const snpCount = useMemo(
    () => variants.filter((v) => (v.variant_type || "").toLowerCase() === "snp").length,
    [variants]
  );
  const indelCount = useMemo(
    () => variants.filter((v) => (v.variant_type || "").toLowerCase() === "indel").length,
    [variants]
  );

  // --- External refs
  const openExternalRefs = () => {
    if (!gene) return;

    const geneName = gene.gene_name || gene.gene_id || geneId;
    const ensemblQuery = encodeURIComponent(geneName);
    const ncbiQuery = encodeURIComponent(geneName);

    window.open(`https://www.ensembl.org/Multi/Search/Results?q=${ensemblQuery}`, "_blank");
    window.open(`https://www.ncbi.nlm.nih.gov/gene/?term=${ncbiQuery}`, "_blank");
  };

  // --- Download variants CSV (client-side)
  const downloadVariantsCsv = () => {
    const items = filteredVariants.length ? filteredVariants : variants;
    if (!items || items.length === 0) return;

    const headers = [
      "id",
      "chromosome_name",
      "position",
      "reference_allele",
      "alternate_allele",
      "variant_type",
      "filter_status",
      "total_depth",
      "rs_id",
    ];

    const escape = (val) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replaceAll('"', '""')}"`;
      }
      return s;
    };

    const csv = [
      headers.join(","),
      ...items.map((v) =>
        headers
          .map((h) => escape(v[h]))
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${gene?.gene_name || geneId}_variants.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Card withBorder radius="md" p="lg">
          <Title order={3}>Greška</Title>
          <Text c="red" mt="sm">
            {error}
          </Text>
          <Button mt="md" variant="outline" onClick={() => navigate("/")}>
            Povratak na početnu
          </Button>
        </Card>
      </Container>
    );
  }

  if (loading || !gene) {
    return (
      <Container size="lg" py="xl">
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Top bar */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <Title order={4}>Genome Variant Browser</Title>

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

        {/* Header row */}
        <Group align="flex-start" justify="space-between" wrap="wrap">
          <Stack gap={8} maw={720}>
            <Title order={2}>Gene: {gene.gene_name}</Title>

            <Text c="dimmed">
              <b>{gene.gene_name}</b>: {gene.gene_type}
            </Text>

            <Text c="dimmed">
              region:{" "}
              <Anchor href="#" onClick={(e) => e.preventDefault()}>
                {regionLabel}
              </Anchor>
            </Text>

            <Group mt="sm">
              <Button variant="light" onClick={openExternalRefs}>
                External References
              </Button>
              <Button variant="light" onClick={downloadVariantsCsv} disabled={variants.length === 0}>
                Download all variants (CSV)
              </Button>
            </Group>
          </Stack>

          <Card withBorder radius="md" p="md" miw={360}>
            <Table withTableBorder withColumnBorders>
              <thead>
                <tr>
                  <th>variant type</th>
                  <th style={{ textAlign: "right" }}>count (PASS-only)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>All - SNPs</td>
                  <td style={{ textAlign: "right" }}>{snpCount}</td>
                </tr>
                <tr>
                  <td>All - Indels</td>
                  <td style={{ textAlign: "right" }}>{indelCount}</td>
                </tr>
                <tr>
                  <td>Coding - LoF</td>
                  <td style={{ textAlign: "right" }}>0</td>
                </tr>
                <tr>
                  <td>Coding - Missense</td>
                  <td style={{ textAlign: "right" }}>0</td>
                </tr>
                <tr>
                  <td>Coding - Synonymous</td>
                  <td style={{ textAlign: "right" }}>0</td>
                </tr>
              </tbody>
            </Table>
          </Card>
        </Group>

        {/* Coverage */}
        <Card withBorder radius="md" p="lg">
          <Group justify="space-between" align="center" wrap="wrap">
            <Title order={3}>Coverage Depth</Title>

            <Group gap="md" wrap="wrap">
              <SegmentedControl
                data={[
                  { value: "avg", label: "Average" },
                  { value: "overx", label: "Individuals over X" },
                ]}
                value="avg"
                onChange={() => {}}
              />
              <Select data={["mean", "median"]} value="mean" onChange={() => {}} w={140} />
            </Group>
          </Group>

          <Divider my="md" />

          <Card withBorder radius="md" p="lg">
            <Text c="dimmed" size="sm">
              Coverage plot placeholder (we can add a real chart later)
            </Text>
            <div style={{ height: 220 }} />
          </Card>
        </Card>

        {/* Variants */}
        <Card withBorder radius="md" p="lg">
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Stack gap={2}>
              <Title order={3}>Variants</Title>
              <Text c="dimmed" size="sm">
                Showing{" "}
                {filteredVariants.length === 0
                  ? 0
                  : Math.min((page - 1) * pageSizeNum + 1, filteredVariants.length)}
                –
                {Math.min(page * pageSizeNum, filteredVariants.length)} of {filteredVariants.length}
              </Text>
            </Stack>

            <Group gap="md" wrap="wrap">
              <SegmentedControl
                value={variantTab}
                onChange={setVariantTab}
                data={[
                  { value: "all", label: "All" },
                  { value: "snp", label: "SNPs" },
                  { value: "indel", label: "Indels" },
                ]}
              />
              <Select
                label="Quality"
                data={[
                  { value: "PASS", label: "PASS" },
                  { value: "ALL", label: "ALL" },
                ]}
                value={quality}
                onChange={(v) => setQuality(v || "PASS")}
                w={160}
              />
              <Select
                label="Show"
                data={[
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                  { value: "200", label: "200" },
                ]}
                value={pageSize}
                onChange={(v) => setPageSize(v || "100")}
                w={140}
              />
            </Group>
          </Group>

          <Group mt="md" align="flex-end" wrap="wrap">
            <TextInput
              label="Search variants"
              placeholder="chr pos ref alt or rsID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              w={520}
            />
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setVariantTab("all");
                setQuality("PASS");
              }}
            >
              Reset filters
            </Button>
          </Group>

          <Divider my="md" />

          {filteredVariants.length === 0 ? (
            <Card withBorder radius="md" p="lg">
              <Group justify="space-between">
                <Text fw={600}>No variants found</Text>
                <Badge variant="light">0</Badge>
              </Group>
              <Text c="dimmed" size="sm" mt="xs">
                Backend returned 0 variants for this gene (or filters removed them).
              </Text>
            </Card>
          ) : (
            <>
              <Table striped highlightOnHover withTableBorder>
                <thead>
                  <tr>
                    <th>Alleles</th>
                    <th>Position</th>
                    <th>Type</th>
                    <th>Quality</th>
                    <th>DP</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedVariants.map((v) => {
                    const alleleLabel = `${v.reference_allele ?? "-"} → ${v.alternate_allele ?? "-"}`;
                    const posLabel = `chr${v.chromosome_name ?? "?"}:${v.position ?? "?"}`;

                    return (
                      <tr
                        key={v.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          const chr = v.chromosome_name ?? "";
                          const pos = v.position ?? "";
                          const ref = v.reference_allele ?? "";
                          const alt = v.alternate_allele ?? "";
                          // nice URL like "4-71616842-A-G"
                          const vid = `${chr}-${pos}-${ref}-${alt}`;
                          navigate(`/variant/${encodeURIComponent(vid)}`);
                        }}
                      >

                        <td>
                          <Stack gap={2}>
                            <Text fw={600}>{alleleLabel}</Text>
                            {v.rs_id ? (
                              <Text c="dimmed" size="sm">
                                {v.rs_id}
                              </Text>
                            ) : null}
                          </Stack>
                        </td>
                        <td>{posLabel}</td>
                        <td>
                          <Badge variant="light">{(v.variant_type || "unknown").toString()}</Badge>
                        </td>
                        <td>
                          <Badge color={v.filter_status === "PASS" ? "green" : "gray"} variant="light">
                            {v.filter_status || "—"}
                          </Badge>
                        </td>
                        <td>{v.total_depth ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              <Group justify="space-between" mt="md" wrap="wrap">
                <Text c="dimmed" size="sm">
                  Page {page} of {totalPages}
                </Text>
                <Pagination value={page} onChange={setPage} total={totalPages} />
              </Group>
            </>
          )}
        </Card>
      </Stack>
    </Container>
  );
}

export default GenePage;
