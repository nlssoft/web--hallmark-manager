import { useState } from "react";

//states
const type = ["record", "payment", "advance_ledger", "audit"];

const INITIAL_FILTERS = {
  type: "record",
  party: "all",
  party_id: "",
  date_from: "",
  date_to: "",
  status: "",
  direction: "",
  model: "",
  action: "",
  page: "",
  page_size: "",
};

function SummaryPage() {
  const [filter, setFilters] = useState(filter);

  function handleChange(key, value) {
    setFilters((perv) => ({
      ...perv,
      [key]: value,
      page: 1,
    }));
  }

  return <div>Summary</div>;
}

export default SummaryPage;
