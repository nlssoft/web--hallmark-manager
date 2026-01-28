// PartyDetail.js
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function PartyDetail() {
  const { id } = useParams();
  const [party, setParty] = useState(null);

  useEffect(() => {
    api.get(`/history/party/${id}/`)
      .then(res => setParty(res.data));
  }, [id]);

  if (!party) return <p>Loading...</p>;

  return (
    <>
      <h1>{party.first_name} {party.last_name}</h1>
      <p>Logo: {party.logo}</p>
      <p>Phone: {party.number}</p>
      <p>Email: {party.email}</p>
      <p>Address: {party.address}</p>
      <p>Due: {party.due}</p>
      <p>Advance: {party.advance_balance}</p>
    </>
  );
}
