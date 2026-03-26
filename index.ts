import express from "express";

const PORT = 8000;
const app = express();

app.use(express.json()); // agar bisa menerima req.body

const users = [
  { id: 1, name: "Kiwil" },
  { id: 2, name: "Budi" },
  { id: 3, name: "Lala" },
  { id: 4, name: "Jaya" },
];

app.get("/api", (req, res) => {
  res.status(200).send("Welcome To My API");
});

app.get("/users", (req, res) => {
  res.status(200).send(users);
});

app.get("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const result = users.find((user) => user.id === id);

  if (!result) res.status(404).send({ message: "User Not Found" });

  res.status(200).send(result);
});

app.patch("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const result = users.find((user) => user.id === id);

  if (!result) return res.status(404).send({ message: "User Not Found" });

  result.name = req.body.name;

  res.status(200).send(result);
});

app.post("/users", (req, res) => {
  users.push({
    id: users[users.length - 1].id + 1,
    name: req.body.name,
  });
  res.status(200).send({ message: "Success" });
});

app.delete("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const result = users.find((user) => user.id === id);

  if (!result) return res.status(404).send({ message: "User Not Found" });

  const index = users.indexOf(result); // cari posisi index-nya di array
  users.splice(index, 1); // hapus 1 element di index tersebut

  res.status(200).send({ message: "User Deleted" });
});

app.use((req, res) => {
  res.status(404).send({ message: "Route Not Found!" });
});

app.listen(PORT, () => {
  console.log(`Server Running On PORT ${PORT}`);
});
