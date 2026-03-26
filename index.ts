import { application } from "express";
import http from "http";

const PORT = 8000;

const users = [
  { id: 1, name: "Budi" },
  { id: 2, name: "Budi" },
  { id: 3, name: "Budi" },
];
const server = http.createServer((request, response) => {
  if (request.url === "/api" && request.method === "GET") {
    response.writeHead(200);
    response.write("Welcome to my API");
    response.end();
  } else if (request.url === "/users" && request.method === "GET") {
    response.writeHead(200, { "content-type": "application/json" });
    response.write(JSON.stringify(users));
    response.end();
  } else {
    response.writeHead(400);
    response.write("Path Not Found");
    response.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server Running on PORT: ${PORT}`);
});
