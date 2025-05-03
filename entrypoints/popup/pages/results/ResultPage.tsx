import { Button } from "@heroui/button";
import { useNavigate } from "react-router";

function ResultPage() {
  const navigation = useNavigate();

  return (
    <div>
      <Button color="primary" variant="solid" onPress={() => navigation("/")}>
        Back
      </Button>
    </div>
  );
}

export default ResultPage;
