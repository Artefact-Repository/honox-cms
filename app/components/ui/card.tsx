import CardIsland from "../../islands/card";
import { CardBase, type CardBaseProps } from "./card-primitive";

export interface CardProps extends CardBaseProps {
	interactive?: boolean;
}

export function Card(props: CardProps) {
	const { interactive, ...rest } = props;
	if (interactive) {
		return <CardIsland {...rest} />;
	}
	return <CardBase {...rest} />;
}

export default Card;
