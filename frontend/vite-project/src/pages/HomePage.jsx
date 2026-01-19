//import "../App.css";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";
import {
  Anchor,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

const DEFAULT_VARIANT_LIMIT = 25;

function HomePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const [searchTerm, setSearchTerm] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [searchError, setSearchError] = useState("");

  const isAuthenticated = useMemo(() => Boolean(user && token), [user, token]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setGlobalError("");
    setSearchError("");
    navigate("/login");
  }, [navigate]);

  const handleSearch = async () => {
    const query = searchTerm.trim();
    if (!query) {
      setSearchError("Unesite ID gena.");
      return;
    }

    setSearchError("");
    setGlobalError("");

    try {
      const res = await fetch(`${API_BASE_URL}/genes/${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Greška");

      const data = await res.json();

      // Your API returns a gene object; keep behavior: go to /genes/{gene_id}
      if (!data || !data.gene_id) {
        setSearchError("Nije pronađen nijedan gen s tim imenom.");
        return;
      }

      navigate(`/genes/${data.gene_id}`);
    } catch (err) {
      console.error(err);
      setSearchError("Došlo je do pogreške prilikom pretraživanja.");
    }
  };

  useEffect(() => {
    const synchronizeAuthState = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setToken(localStorage.getItem("token"));
    };

    synchronizeAuthState();
    window.addEventListener("storage", synchronizeAuthState);
    return () => window.removeEventListener("storage", synchronizeAuthState);
  }, []);

  const handleLoginClick = () => navigate("/login");
  const handleRegisterClick = () => navigate("/register");

  // ---------- NOT AUTH ----------
  if (!isAuthenticated) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="lg" align="center">
          <Title order={2}>Početna stranica</Title>
          <Text c="dimmed" ta="center">
            Za nastavak rada prijavite se ili registrirajte novi korisnički račun.
          </Text>

          <Card withBorder radius="md" w="100%" maw={520} p="xl">
            <Stack gap="md">
              <Group justify="center">
                <Button onClick={handleLoginClick}>Prijava</Button>
                <Button variant="outline" onClick={handleRegisterClick}>
                  Registracija
                </Button>
              </Group>
              <Text size="sm" c="dimmed" ta="center">
                Ako već imate račun, kliknite Prijava. Ako nemate, Registracija.
              </Text>
            </Stack>
          </Card>
        </Stack>
      </Container>
    );
  }

  // ---------- AUTH ----------
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Title order={2}>Dobrodošli, {user.username}!</Title>
            <Text c="dimmed">
              U nastavku možete pregledati gene, uzorke i varijante.
            </Text>
          </div>
          <Button color="red" variant="outline" onClick={handleLogout}>
            Odjava
          </Button>
        </Group>

        {globalError && (
          <Card withBorder radius="md" p="md">
            <Text c="red">{globalError}</Text>
          </Card>
        )}

        <Card withBorder radius="md" p="xl">
          <Stack gap="sm">
            <Title order={4}>Pretraga</Title>

            <Group grow align="end">
              <TextInput
                label="Gene ID"
                placeholder="Unesite ID gena."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <Button onClick={handleSearch}>Pretraživanje</Button>
            </Group>

            <Text size="sm" c="dimmed">
              Primjer: ENSBTAG00000004503
            </Text>

            {searchError && <Text c="red">{searchError}</Text>}
          </Stack>
        </Card>

        <Text size="sm" c="dimmed">
          Powered by your API at <Anchor href={API_BASE_URL} target="_blank"> {API_BASE_URL}</Anchor>
        </Text>
      </Stack>
    </Container>
  );
}

export default HomePage;
