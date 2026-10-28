import { useEffect, useState } from "react";
import { fetchUsers } from "../services/users.service";
import { SystemUser } from "../types/user";

export function useUsers() {
  const [users, setUsers] = useState<SystemUser[]>([]);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => console.error("Error al cargar usuarios:", err));
  }, []);

  return users;
}
