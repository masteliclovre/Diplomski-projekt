import "../App.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import {
  Anchor,
  Button,
  Card,
  Container,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Neuspjela prijava.");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>Prijava</Title>
          <Text c="dimmed">Unesite svoje podatke za pristup sustavu.</Text>
        </div>

        <Card withBorder radius="md" p="xl">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Korisničko ime"
                placeholder="Unesite korisničko ime"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <PasswordInput
                label="Lozinka"
                placeholder="Unesite lozinku"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && <Text c="red">{error}</Text>}

              <Button type="submit" loading={loading}>
                Prijavi se
              </Button>
            </Stack>
          </form>
        </Card>

        <Text size="sm" c="dimmed">
          Nemate račun?{" "}
          <Anchor component="button" type="button" onClick={() => navigate("/register")}>
            Registrirajte se
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}

export default Login;
