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
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

function RegistrationPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [role, setRole] = useState("user");
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

    if (password !== passwordRepeat) {
      setError("Lozinke se ne podudaraju.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Neuspjela registracija.");
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
          <Title order={2}>Registracija</Title>
          <Text c="dimmed">
            Ispunite obrazac kako biste kreirali korisnički račun i pristupili sustavu.
          </Text>
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

              <TextInput
                label="E-mail"
                type="email"
                placeholder="Unesite e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <PasswordInput
                label="Lozinka"
                placeholder="Unesite lozinku"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <PasswordInput
                label="Ponovi lozinku"
                placeholder="Ponovite lozinku"
                value={passwordRepeat}
                onChange={(e) => setPasswordRepeat(e.target.value)}
                required
              />

              <Select
                label="Uloga"
                value={role}
                onChange={(value) => setRole(value || "user")}
                data={[
                  { value: "user", label: "Korisnik" },
                  { value: "admin", label: "Administrator" },
                ]}
              />

              {error && <Text c="red">{error}</Text>}

              <Button type="submit" loading={loading}>
                Registriraj se
              </Button>
            </Stack>
          </form>
        </Card>

        <Text size="sm" c="dimmed">
          Već imate račun?{" "}
          <Anchor component="button" type="button" onClick={() => navigate("/login")}>
            Prijavite se
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}

export default RegistrationPage;
