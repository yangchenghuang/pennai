import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from 'data/builder/actions';
import SceneHeader from '../SceneHeader';
import NotFound from '../NotFound';
import FetchError from '../FetchError';
import AlgorithmOptions from './components/AlgorithmOptions';
import ParameterOptions from './components/ParameterOptions';
import { Grid, Button, Icon, Popup, Loader } from 'semantic-ui-react';
import { formatDataset } from 'utils/formatter';
import { hashHistory } from 'react-router';

class Builder extends Component {
  constructor(props) {
    super(props);
    this.state = { dataset: null };
    this.handleSubmitExperiment = this.handleSubmitExperiment.bind(this);
    this.handleResetExperiment = this.handleResetExperiment.bind(this);
  }

  componentDidMount() {
    const { defaultAlgorithms, availableAlgorithms, setCurrentAlgorithm } = this.props;
    setCurrentAlgorithm(availableAlgorithms[0]);
    
    if(!this.props.dataset) {
      fetch(`/api/datasets/${this.props.location.query.dataset}`)
        .then(response => {
          if(response.status >= 400) {
            throw new Error(`${response.status}: ${response.statusText}`);
          }  
          return response.json();
        })
        .then(dataset => this.setState({ dataset: dataset[0] }));
    } 
  }

  componentDidUpdate(prevProps) {
    // if finished submitting and no error, redirect
    if(prevProps.isSubmitting && !this.props.isSubmitting && !this.props.error) {
      hashHistory.push('/experiments'); // redirect to experiments page
    }
  }

  componentWillUnmount() {
    const { defaultAlgorithms, availableAlgorithms, setCurrentAlgorithm, clearError } = this.props;
    setCurrentAlgorithm(availableAlgorithms[0]);
    clearError();
  }

  handleSubmitExperiment() {
    const dataset = this.props.dataset || this.state.dataset;
    const { currentAlgorithm, currentParams, submitExperiment } = this.props;
    const validParams = Object.assign({}, currentParams, {
      dataset: dataset._id
    });

    submitExperiment(currentAlgorithm._id, validParams);
  }

  handleResetExperiment() {
    const { currentAlgorithm, setCurrentAlgorithm } = this.props;
    setCurrentAlgorithm(currentAlgorithm);
  }

  render() {
    const dataset = this.props.dataset || this.state.dataset;
    const { 
      defaultAlgorithms,
      availableAlgorithms,
      currentAlgorithm, 
      currentParams,
      isSubmitting,
      error,
      setCurrentAlgorithm,
      setParamValue
    } = this.props;
    return (
      <div className="builder-scene">
        <SceneHeader 
          header={
            'Build New Experiment' + `${dataset ? `: ${formatDataset(dataset.name)}` : '' + '${}' }`
          } 
        />
        <Grid stretched>
          <AlgorithmOptions
            algorithms={availableAlgorithms}
            currentAlgorithm={currentAlgorithm}
            setCurrentAlgorithm={setCurrentAlgorithm}
          />
          <ParameterOptions
            params={currentAlgorithm.schema}
            currentParams={currentParams}
            setParamValue={setParamValue}
          />
        </Grid>
        <div className="builder-btns">
          <Popup
            header="Error submitting experiment:"
            content={error}
            open={error ? true : false}
            trigger={
              <Button 
                color="blue"
                size="large"
                content="Launch Experiment"
                icon={isSubmitting ? <Icon loading name="spinner" /> : null}
                disabled={isSubmitting}
                onClick={this.handleSubmitExperiment}
              />
            }
          />
          <Button 
            color="grey"
            size="large"
            content="Reset"
            disabled={isSubmitting}
            onClick={this.handleResetExperiment}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => (
{
  dataset: state.datasets.byId[props.location.query.dataset],
  defaultAlgorithms: state.preferences.data.algorithms,
  availableAlgorithms: state.preferences.data.algorithms.filter(function(algo) {
      return algo.category==state.datasets.byId[props.location.query.dataset].files[0].prediction_type
   }),
  currentAlgorithm: state.builder.currentAlgorithm,
  currentParams: state.builder.currentParams,
  isSubmitting: state.builder.isSubmitting,
  error: state.builder.error
});

export { Builder };
export default connect(mapStateToProps, actions)(Builder);