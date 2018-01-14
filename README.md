
# Grid React Adapter

## Example

```jsx
import { ReactGrid } from 'grid-react-adapter'

/* Mock Data */

const cols = Array.from({ length: 100 }, () => ({}))

const rows = Array.from({ length: 1000 }, (_, rowIndex) => ({
  data: cols.map(_, columnIndex) => ({
    formatted: rowIndex + ', ' + columnIndex,
  })),
}))

rows[0].header = true
rows[0].height = 50

/* Mock Data */

class Table extends React.Component {
  render () {
    return (
      <div>
        <ReactGrid rows={rows} cols={cols} />
      </div>
    )
  }
}
```

### Props and Formats

#### Cell Data Format

```js
{
  formatted: 'formatted string' // String
}
```

#### Column Format

```js
{
  hidden: true, // Boolean
  width: 50, // Number
}
```

#### Row Format

```js
{
  data: [{ formatted: '0,0' }, { formatted: '0,1' }, ...], // Array of Cells
  header: false, // Boolean
  height: 50, // Number
}
```
  
